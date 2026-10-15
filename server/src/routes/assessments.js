import { Router } from 'express';
import { db } from '../db/index.js';

const router = Router();

function getParticipantOr404(code, res) {
  const row = db.prepare('SELECT * FROM participants WHERE study_code = ?').get(code.toUpperCase());
  if (!row) {
    res.status(404).json({ error: 'Participant not found.' });
    return null;
  }
  return row;
}

// Baseline (phase="baseline") and end-of-study (phase="final") assessments —
// the same standardized questionnaire is used for both so the researcher can
// compare pre/post.
router.post('/participants/:code/assessments', (req, res) => {
  const participant = getParticipantOr404(req.params.code, res);
  if (!participant) return;

  const { phase, anxietyNow, fearRating, questionnaire, helpedMost, couldImprove } = req.body || {};
  if (!['baseline', 'final'].includes(phase)) {
    return res.status(400).json({ error: 'phase must be "baseline" or "final".' });
  }
  const anx = Number(anxietyNow);
  const fear = Number(fearRating);
  if (!Number.isInteger(anx) || anx < 1 || anx > 10 || !Number.isInteger(fear) || fear < 1 || fear > 10) {
    return res.status(400).json({ error: 'anxietyNow and fearRating must be integers between 1 and 10.' });
  }

  const questionnaireAnswers = questionnaire || {};
  // Sum of every numeric answer in the questionnaire (GAD-7: 7 items on a
  // 0-3 scale, so 0-21 once all are answered). Stored alongside the raw
  // per-item JSON so the dashboard/export can show a single score without
  // every consumer having to re-parse and re-sum it themselves.
  const numericAnswers = Object.values(questionnaireAnswers).filter(
    (v) => typeof v === 'number' && Number.isFinite(v)
  );
  const questionnaireTotal = numericAnswers.length > 0 ? numericAnswers.reduce((sum, v) => sum + v, 0) : null;

  db.prepare(
    `INSERT INTO assessments (participant_id, phase, anxiety_now, fear_rating, questionnaire_json, questionnaire_total, helped_most, could_improve)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    participant.id,
    phase,
    anx,
    fear,
    JSON.stringify(questionnaireAnswers),
    questionnaireTotal,
    phase === 'final' ? (helpedMost || '').slice(0, 2000) : null,
    phase === 'final' ? (couldImprove || '').slice(0, 2000) : null
  );

  if (phase === 'baseline') {
    db.prepare(
      `INSERT INTO session_log (participant_id, session_number, started_at)
       VALUES (?, 1, datetime('now'))
       ON CONFLICT(participant_id, session_number) DO NOTHING`
    ).run(participant.id);
  }
  if (phase === 'final') {
    db.prepare(`UPDATE participants SET status = 'completed', updated_at = datetime('now') WHERE id = ?`).run(
      participant.id
    );
  }

  // questionnaireTotal is returned so the client can check the baseline
  // GAD-7 score right after submitting and show the distress-check screen
  // (see Baseline.jsx) without a second round-trip.
  res.status(201).json({ ok: true, questionnaireTotal });
});

router.get('/participants/:code/assessments', (req, res) => {
  const participant = getParticipantOr404(req.params.code, res);
  if (!participant) return;
  const rows = db
    .prepare(
      'SELECT phase, anxiety_now, fear_rating, questionnaire_json, questionnaire_total, helped_most, could_improve, created_at FROM assessments WHERE participant_id = ? ORDER BY created_at ASC'
    )
    .all(participant.id);
  res.json(rows.map((r) => ({ ...r, questionnaire: JSON.parse(r.questionnaire_json) })));
});

export default router;
