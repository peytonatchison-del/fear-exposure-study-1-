import { Router } from 'express';
import { db, getConfig } from '../db/index.js';
import { requireResearcher } from '../middleware/auth.js';
import { describe } from '../utils/stats.js';

const router = Router();
router.use(requireResearcher);

router.get('/researcher/participants', (req, res) => {
  const includeDemo = req.query.includeDemo !== '0';
  const rows = db
    .prepare(
      `SELECT p.*,
        (SELECT COUNT(*) FROM session_log sl WHERE sl.participant_id = p.id AND sl.completed_at IS NOT NULL) AS sessions_completed,
        (SELECT COUNT(*) FROM assessments a WHERE a.participant_id = p.id AND a.phase = 'baseline') AS has_baseline,
        (SELECT COUNT(*) FROM assessments a WHERE a.participant_id = p.id AND a.phase = 'final') AS has_final
       FROM participants p
       ${includeDemo ? '' : 'WHERE p.is_demo = 0'}
       ORDER BY p.created_at DESC`
    )
    .all();
  res.json(
    rows.map((r) => ({
      studyCode: r.study_code,
      fearCategoryId: r.fear_category_id,
      isDemo: !!r.is_demo,
      status: r.status,
      currentSessionNumber: r.current_session_number,
      sessionsCompleted: r.sessions_completed,
      hasBaseline: !!r.has_baseline,
      hasFinal: !!r.has_final,
      createdAt: r.created_at,
    }))
  );
});

router.get('/researcher/participants/:code', (req, res) => {
  const participant = db.prepare('SELECT * FROM participants WHERE study_code = ?').get(req.params.code.toUpperCase());
  if (!participant) return res.status(404).json({ error: 'Participant not found.' });
  const assessments = db
    .prepare('SELECT * FROM assessments WHERE participant_id = ? ORDER BY created_at ASC')
    .all(participant.id)
    .map((a) => ({ ...a, questionnaire: JSON.parse(a.questionnaire_json) }));
  const exposures = db
    .prepare('SELECT * FROM exposure_responses WHERE participant_id = ? ORDER BY session_number, exposure_level')
    .all(participant.id);
  const sessions = db
    .prepare('SELECT * FROM session_log WHERE participant_id = ? ORDER BY session_number')
    .all(participant.id);
  res.json({
    studyCode: participant.study_code,
    fearCategoryId: participant.fear_category_id,
    isDemo: !!participant.is_demo,
    status: participant.status,
    currentSessionNumber: participant.current_session_number,
    createdAt: participant.created_at,
    assessments,
    exposures,
    sessions,
  });
});

router.delete('/researcher/demo-data', (req, res) => {
  const ids = db.prepare('SELECT id FROM participants WHERE is_demo = 1').all().map((r) => r.id);
  const del = db.transaction((participantIds) => {
    for (const id of participantIds) {
      db.prepare('DELETE FROM assessments WHERE participant_id = ?').run(id);
      db.prepare('DELETE FROM exposure_responses WHERE participant_id = ?').run(id);
      db.prepare('DELETE FROM session_log WHERE participant_id = ?').run(id);
      db.prepare('DELETE FROM participants WHERE id = ?').run(id);
    }
  });
  del(ids);
  res.json({ ok: true, removed: ids.length });
});

// ---------------------------------------------------------------------------
// Aggregated data for the six required dashboard charts. All numbers here are
// descriptive statistics only (mean/median/sd/n) — no significance testing,
// no claims about whether the exposure protocol "worked."
// ---------------------------------------------------------------------------
router.get('/researcher/summary', (req, res) => {
  const includeDemo = req.query.includeDemo !== '0';
  const demoFilter = includeDemo ? '' : 'AND p.is_demo = 0';
  const categories = getConfig('fear_categories') || [];

  // 1 & 2: baseline vs final fear / anxiety ratings, paired by participant.
  const baselineFinal = db
    .prepare(
      `SELECT p.study_code, p.fear_category_id, a.phase, a.anxiety_now, a.fear_rating
       FROM assessments a JOIN participants p ON p.id = a.participant_id
       WHERE a.phase IN ('baseline','final') ${demoFilter}
       ORDER BY p.study_code`
    )
    .all();
  const byParticipant = {};
  for (const row of baselineFinal) {
    byParticipant[row.study_code] ??= { studyCode: row.study_code, fearCategoryId: row.fear_category_id };
    byParticipant[row.study_code][row.phase] = { anxiety: row.anxiety_now, fear: row.fear_rating };
  }
  const pairedTrajectories = Object.values(byParticipant).filter((p) => p.baseline && p.final);

  const baselineFearVals = pairedTrajectories.map((p) => p.baseline.fear);
  const finalFearVals = pairedTrajectories.map((p) => p.final.fear);
  const baselineAnxietyVals = pairedTrajectories.map((p) => p.baseline.anxiety);
  const finalAnxietyVals = pairedTrajectories.map((p) => p.final.anxiety);

  // 3: anxiety before/during/after, averaged per exposure level across all trials.
  const exposureRows = db
    .prepare(
      `SELECT e.exposure_level, e.pre_rating, e.during_rating, e.post_rating
       FROM exposure_responses e JOIN participants p ON p.id = e.participant_id
       WHERE 1=1 ${demoFilter}`
    )
    .all();
  const byLevel = {};
  for (let lvl = 1; lvl <= 5; lvl += 1) byLevel[lvl] = { pre: [], during: [], post: [] };
  for (const r of exposureRows) {
    byLevel[r.exposure_level].pre.push(r.pre_rating);
    byLevel[r.exposure_level].during.push(r.during_rating);
    byLevel[r.exposure_level].post.push(r.post_rating);
  }
  const anxietyByLevel = Object.entries(byLevel).map(([level, v]) => ({
    level: Number(level),
    pre: describe(v.pre),
    during: describe(v.during),
    post: describe(v.post),
  }));

  // 4: anxiety across repeated sessions (mean "during" rating per session number).
  const sessionRows = db
    .prepare(
      `SELECT e.session_number, e.during_rating, e.pre_rating, e.post_rating
       FROM exposure_responses e JOIN participants p ON p.id = e.participant_id
       WHERE 1=1 ${demoFilter}`
    )
    .all();
  const bySession = {};
  for (const r of sessionRows) {
    bySession[r.session_number] ??= { pre: [], during: [], post: [] };
    bySession[r.session_number].pre.push(r.pre_rating);
    bySession[r.session_number].during.push(r.during_rating);
    bySession[r.session_number].post.push(r.post_rating);
  }
  const anxietyBySession = Object.entries(bySession)
    .map(([sessionNumber, v]) => ({
      sessionNumber: Number(sessionNumber),
      pre: describe(v.pre),
      during: describe(v.during),
      post: describe(v.post),
    }))
    .sort((a, b) => a.sessionNumber - b.sessionNumber);

  // 5: individual participant trajectories — mean "during" rating per session, per participant.
  const trajectoryRows = db
    .prepare(
      `SELECT p.study_code, p.fear_category_id, e.session_number, e.during_rating
       FROM exposure_responses e JOIN participants p ON p.id = e.participant_id
       WHERE 1=1 ${demoFilter}
       ORDER BY p.study_code, e.session_number`
    )
    .all();
  const trajectoryMap = {};
  for (const r of trajectoryRows) {
    trajectoryMap[r.study_code] ??= { studyCode: r.study_code, fearCategoryId: r.fear_category_id, bySession: {} };
    trajectoryMap[r.study_code].bySession[r.session_number] ??= [];
    trajectoryMap[r.study_code].bySession[r.session_number].push(r.during_rating);
  }
  const individualTrajectories = Object.values(trajectoryMap).map((p) => ({
    studyCode: p.studyCode,
    fearCategoryId: p.fearCategoryId,
    points: Object.entries(p.bySession)
      .map(([sessionNumber, vals]) => ({
        sessionNumber: Number(sessionNumber),
        meanDuring: describe(vals).mean,
      }))
      .sort((a, b) => a.sessionNumber - b.sessionNumber),
  }));

  // 6: aggregate results by fear category (baseline vs final fear rating).
  const byCategory = {};
  for (const p of pairedTrajectories) {
    byCategory[p.fearCategoryId] ??= { baselineFear: [], finalFear: [], baselineAnxiety: [], finalAnxiety: [] };
    byCategory[p.fearCategoryId].baselineFear.push(p.baseline.fear);
    byCategory[p.fearCategoryId].finalFear.push(p.final.fear);
    byCategory[p.fearCategoryId].baselineAnxiety.push(p.baseline.anxiety);
    byCategory[p.fearCategoryId].finalAnxiety.push(p.final.anxiety);
  }
  // Union current categories with any category IDs actually present in the
  // data, so renamed/removed categories don't silently drop their existing
  // data out of this chart (the raw export always has everything regardless).
  const knownIds = new Set(categories.map((c) => c.id));
  const extraIds = Object.keys(byCategory).filter((id) => !knownIds.has(id));
  const categoryDefs = [
    ...categories.map((c) => ({ id: c.id, name: c.name })),
    ...extraIds.map((id) => ({ id, name: `${id} (removed from protocol)` })),
  ];
  const aggregateByCategory = categoryDefs.map((c) => ({
    categoryId: c.id,
    categoryName: c.name,
    baselineFear: describe(byCategory[c.id]?.baselineFear || []),
    finalFear: describe(byCategory[c.id]?.finalFear || []),
    baselineAnxiety: describe(byCategory[c.id]?.baselineAnxiety || []),
    finalAnxiety: describe(byCategory[c.id]?.finalAnxiety || []),
  }));

  res.json({
    participantCount: Object.keys(byParticipant).length,
    pairedCount: pairedTrajectories.length,
    baselineVsFinalFear: { baseline: describe(baselineFearVals), final: describe(finalFearVals) },
    baselineVsFinalAnxiety: { baseline: describe(baselineAnxietyVals), final: describe(finalAnxietyVals) },
    pairedTrajectories,
    anxietyByLevel,
    anxietyBySession,
    individualTrajectories,
    aggregateByCategory,
  });
});

export default router;
