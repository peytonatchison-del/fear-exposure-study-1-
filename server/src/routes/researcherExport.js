import { Router } from 'express';
import { db } from '../db/index.js';
import { requireResearcher } from '../middleware/auth.js';

const router = Router();
router.use(requireResearcher);

function toCsv(rows, columns) {
  const escape = (val) => {
    if (val === null || val === undefined) return '';
    const s = String(val);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const header = columns.map(escape).join(',');
  const body = rows.map((row) => columns.map((col) => escape(row[col])).join(',')).join('\n');
  return `${header}\n${body}\n`;
}

function sendCsv(res, filename, csv) {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
}

// Every export below is keyed by study_code only — no names, emails, or
// other identifying information is ever stored, so there is nothing further
// to strip before export.

router.get('/researcher/export/participants.csv', (req, res) => {
  const includeDemo = req.query.includeDemo !== '0';
  const rows = db
    .prepare(
      `SELECT study_code, fear_category_id, is_demo, status, current_session_number, created_at
       FROM participants ${includeDemo ? '' : 'WHERE is_demo = 0'} ORDER BY created_at`
    )
    .all()
    .map((r) => ({
      study_code: r.study_code,
      fear_category: r.fear_category_id,
      demo_participant: r.is_demo ? 'yes' : 'no',
      status: r.status,
      current_session_number: r.current_session_number,
      created_at: r.created_at,
    }));
  sendCsv(
    res,
    'participants.csv',
    toCsv(rows, ['study_code', 'fear_category', 'demo_participant', 'status', 'current_session_number', 'created_at'])
  );
});

router.get('/researcher/export/exposure-responses.csv', (req, res) => {
  const includeDemo = req.query.includeDemo !== '0';
  const rows = db
    .prepare(
      `SELECT p.study_code, p.is_demo, e.fear_category_id, e.session_number, e.exposure_level,
              e.created_at, e.pre_rating, e.during_rating, e.post_rating, e.expected_text, e.actual_text,
              e.reflection_text, e.recording_url
       FROM exposure_responses e JOIN participants p ON p.id = e.participant_id
       ${includeDemo ? '' : 'WHERE p.is_demo = 0'}
       ORDER BY p.study_code, e.session_number, e.exposure_level`
    )
    .all()
    .map((r) => ({
      study_code: r.study_code,
      demo_participant: r.is_demo ? 'yes' : 'no',
      fear_category: r.fear_category_id,
      session_number: r.session_number,
      exposure_level: r.exposure_level,
      timestamp: r.created_at,
      pre_exposure_rating: r.pre_rating,
      during_exposure_rating: r.during_rating,
      post_exposure_rating: r.post_rating,
      expected_response: r.expected_text,
      actual_response: r.actual_text,
      reflection_since_last_session: r.reflection_text,
      recording_url: r.recording_url,
    }));
  sendCsv(
    res,
    'exposure-responses.csv',
    toCsv(rows, [
      'study_code',
      'demo_participant',
      'fear_category',
      'session_number',
      'exposure_level',
      'timestamp',
      'pre_exposure_rating',
      'during_exposure_rating',
      'post_exposure_rating',
      'expected_response',
      'actual_response',
      'reflection_since_last_session',
      'recording_url',
    ])
  );
});

router.get('/researcher/export/assessments.csv', (req, res) => {
  const includeDemo = req.query.includeDemo !== '0';
  const rows = db
    .prepare(
      `SELECT p.study_code, p.is_demo, p.fear_category_id, a.phase, a.anxiety_now, a.fear_rating,
              a.questionnaire_json, a.questionnaire_total, a.helped_most, a.could_improve, a.created_at
       FROM assessments a JOIN participants p ON p.id = a.participant_id
       ${includeDemo ? '' : 'WHERE p.is_demo = 0'}
       ORDER BY p.study_code, a.created_at`
    )
    .all()
    .map((r) => ({
      study_code: r.study_code,
      demo_participant: r.is_demo ? 'yes' : 'no',
      fear_category: r.fear_category_id,
      phase: r.phase,
      anxiety_now: r.anxiety_now,
      fear_rating: r.fear_rating,
      questionnaire_json: r.questionnaire_json,
      questionnaire_total_gad7: r.questionnaire_total,
      helped_most: r.helped_most,
      could_improve: r.could_improve,
      timestamp: r.created_at,
    }));
  sendCsv(
    res,
    'assessments.csv',
    toCsv(rows, [
      'study_code',
      'demo_participant',
      'fear_category',
      'phase',
      'anxiety_now',
      'fear_rating',
      'questionnaire_json',
      'questionnaire_total_gad7',
      'helped_most',
      'could_improve',
      'timestamp',
    ])
  );
});

export default router;
