import { Router } from 'express';
import { db, getConfig } from '../db/index.js';
import { generateUniqueStudyCode } from '../utils/codeGenerator.js';

const router = Router();

function publicParticipant(row) {
  if (!row) return null;
  return {
    studyCode: row.study_code,
    fearCategoryId: row.fear_category_id,
    isDemo: !!row.is_demo,
    consentAck: !!row.consent_ack,
    currentSessionNumber: row.current_session_number,
    status: row.status,
  };
}

// Create a brand-new participant record with a freshly generated study code.
// No name, email, or other identifying information is ever accepted here.
router.post('/participants', (req, res) => {
  const { demo } = req.body || {};
  const isDemo = demo ? 1 : 0;
  const settings = getConfig('study_settings') || {};

  if (!isDemo && !settings.irbApproved) {
    return res.status(403).json({
      error: 'Real-participant data collection is blocked until the researcher completes the IRB checklist in the dashboard.',
    });
  }

  const code = generateUniqueStudyCode(db);
  const info = db
    .prepare('INSERT INTO participants (study_code, is_demo) VALUES (?, ?)')
    .run(code, isDemo);
  const row = db.prepare('SELECT * FROM participants WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(publicParticipant(row));
});

// Look up an existing participant by their study code (used to resume a
// later session). Returns 404 without leaking whether it's a formatting
// issue vs. truly not found.
router.get('/participants/:code', (req, res) => {
  const row = db.prepare('SELECT * FROM participants WHERE study_code = ?').get(req.params.code.toUpperCase());
  if (!row) return res.status(404).json({ error: 'No participant found with that study code.' });
  res.json(publicParticipant(row));
});

router.post('/participants/:code/consent', (req, res) => {
  const info = db
    .prepare(`UPDATE participants SET consent_ack = 1, updated_at = datetime('now') WHERE study_code = ?`)
    .run(req.params.code.toUpperCase());
  if (info.changes === 0) return res.status(404).json({ error: 'Participant not found.' });
  const row = db.prepare('SELECT * FROM participants WHERE study_code = ?').get(req.params.code.toUpperCase());
  res.json(publicParticipant(row));
});

// Sets the fear category. Locked after the first time it's set, since the
// rest of the protocol (baseline wording, stimuli) is category-specific.
router.patch('/participants/:code/category', (req, res) => {
  const { fearCategoryId } = req.body || {};
  const categories = getConfig('fear_categories') || [];
  if (!categories.some((c) => c.id === fearCategoryId && c.active)) {
    return res.status(400).json({ error: 'Unknown or inactive fear category.' });
  }
  const existing = db.prepare('SELECT * FROM participants WHERE study_code = ?').get(req.params.code.toUpperCase());
  if (!existing) return res.status(404).json({ error: 'Participant not found.' });

  if (!existing.fear_category_id) {
    db.prepare(`UPDATE participants SET fear_category_id = ?, updated_at = datetime('now') WHERE id = ?`).run(
      fearCategoryId,
      existing.id
    );
  }
  const row = db.prepare('SELECT * FROM participants WHERE id = ?').get(existing.id);
  res.json(publicParticipant(row));
});

router.post('/participants/:code/withdraw', (req, res) => {
  const info = db
    .prepare(`UPDATE participants SET status = 'withdrawn', updated_at = datetime('now') WHERE study_code = ?`)
    .run(req.params.code.toUpperCase());
  if (info.changes === 0) return res.status(404).json({ error: 'Participant not found.' });
  res.json({ ok: true });
});

function publicExtensionRequest(row) {
  return {
    id: row.id,
    sessionLabel: row.session_label,
    note: row.note || '',
    status: row.status,
    grantedHours: row.granted_hours,
    requestedAt: row.requested_at,
    decidedAt: row.decided_at,
  };
}

// Every extension request this participant has ever filed, across all
// sessions — the "Session Window Closed" screen filters this down to the
// one session it cares about, rather than needing a separate endpoint per
// session.
router.get('/participants/:code/extension-requests', (req, res) => {
  const participant = db.prepare('SELECT id FROM participants WHERE study_code = ?').get(req.params.code.toUpperCase());
  if (!participant) return res.status(404).json({ error: 'Participant not found.' });
  const rows = db
    .prepare('SELECT * FROM extension_requests WHERE participant_id = ? ORDER BY requested_at DESC')
    .all(participant.id);
  res.json(rows.map(publicExtensionRequest));
});

// Files a new "please give me more time" request for one specific session
// (sessionLabel is a session number as a string, or "final"). Reached from
// the participant-facing Session Window Closed screen. Blocked while a
// request for that same session is still pending, so someone can't spam
// in a dozen duplicates while waiting on the first one.
router.post('/participants/:code/extension-requests', (req, res) => {
  const { sessionLabel, note } = req.body || {};
  if (!sessionLabel || typeof sessionLabel !== 'string') {
    return res.status(400).json({ error: 'sessionLabel is required.' });
  }
  const participant = db.prepare('SELECT id FROM participants WHERE study_code = ?').get(req.params.code.toUpperCase());
  if (!participant) return res.status(404).json({ error: 'Participant not found.' });

  const existingPending = db
    .prepare(`SELECT id FROM extension_requests WHERE participant_id = ? AND session_label = ? AND status = 'pending'`)
    .get(participant.id, sessionLabel);
  if (existingPending) {
    return res.status(409).json({ error: 'A request for this session is already pending.' });
  }

  const info = db
    .prepare('INSERT INTO extension_requests (participant_id, session_label, note) VALUES (?, ?, ?)')
    .run(participant.id, sessionLabel, (note || '').toString().slice(0, 500) || null);
  const row = db.prepare('SELECT * FROM extension_requests WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(publicExtensionRequest(row));
});

export default router;
