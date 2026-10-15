import { Router } from 'express';
import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';
import { db, getConfig } from '../db/index.js';
import { UPLOADS_DIR } from '../config/paths.js';

const router = Router();

function getParticipantOr404(code, res) {
  const row = db.prepare('SELECT * FROM participants WHERE study_code = ?').get(code.toUpperCase());
  if (!row) {
    res.status(404).json({ error: 'Participant not found.' });
    return null;
  }
  return row;
}

// Storage for participant-recorded audio/video responses (currently just the
// Public Speaking Session 4 "give your own response" exercise). Kept
// entirely separate from the researcher stimuli upload folder. Per that
// session's on-screen disclaimer, these recordings are visible to the
// researcher only, through the Participants tab of the dashboard.
const RECORDINGS_ROOT = path.join(UPLOADS_DIR, 'recordings');
const recordingStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const code = String(req.params.code || 'unknown').toUpperCase().replace(/[^A-Z0-9_-]/g, '_');
    const dir = path.join(RECORDINGS_ROOT, code);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.includes('mp4') ? '.mp4' : file.mimetype.includes('ogg') ? '.ogg' : '.webm';
    cb(null, `session4-${Date.now()}${ext}`);
  },
});
const uploadRecording = multer({
  storage: recordingStorage,
  limits: { fileSize: 150 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!/^(video|audio)\//.test(file.mimetype)) {
      return cb(new Error('Recording must be an audio or video file.'));
    }
    cb(null, true);
  },
});

// Accepts a recorded audio/video blob from the participant's browser (the
// Public Speaking Session 4 exercise) and returns the URL to reference in
// the subsequent exposure-response submission. Uploading here does not by
// itself create a data row — see POST /exposure-responses below, which
// stores the returned URL alongside that trial's ratings.
router.post('/participants/:code/recordings', uploadRecording.single('recording'), (req, res) => {
  const participant = getParticipantOr404(req.params.code, res);
  if (!participant) return;
  if (!req.file) return res.status(400).json({ error: 'No recording uploaded.' });
  const relPath = `/uploads/recordings/${path.basename(path.dirname(req.file.path))}/${req.file.filename}`;
  res.status(201).json({ url: relPath });
});

function validateRating(n) {
  return Number.isInteger(n) && n >= 1 && n <= 10;
}

// Records one exposure trial (a single level within a session). The
// researcher-approved protocol (session-plan) determines which level is
// shown; this endpoint only ever records what happened, it never decides
// what comes next.
router.post('/participants/:code/exposure-responses', (req, res) => {
  const participant = getParticipantOr404(req.params.code, res);
  if (!participant) return;
  if (!participant.fear_category_id) {
    return res.status(400).json({ error: 'Participant has not selected a fear category yet.' });
  }

  const {
    sessionNumber,
    exposureLevel,
    stimulusId,
    preRating,
    duringRating,
    postRating,
    expectedText,
    actualText,
    reflectionText,
    recordingUrl,
  } = req.body || {};

  if (
    !Number.isInteger(sessionNumber) ||
    sessionNumber < 1 ||
    !Number.isInteger(exposureLevel) ||
    exposureLevel < 1 ||
    exposureLevel > 5
  ) {
    return res.status(400).json({ error: 'sessionNumber and exposureLevel (1-5) are required.' });
  }
  if (!validateRating(preRating) || !validateRating(duringRating) || !validateRating(postRating)) {
    return res.status(400).json({ error: 'preRating, duringRating, and postRating must be integers 1-10.' });
  }

  db.prepare(
    `INSERT INTO session_log (participant_id, session_number, started_at)
     VALUES (?, ?, datetime('now'))
     ON CONFLICT(participant_id, session_number) DO NOTHING`
  ).run(participant.id, sessionNumber);

  const info = db
    .prepare(
      `INSERT INTO exposure_responses
        (participant_id, fear_category_id, session_number, exposure_level, stimulus_id,
         pre_rating, during_rating, post_rating, expected_text, actual_text, reflection_text, recording_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      participant.id,
      participant.fear_category_id,
      sessionNumber,
      exposureLevel,
      stimulusId || null,
      preRating,
      duringRating,
      postRating,
      (expectedText || '').slice(0, 2000),
      (actualText || '').slice(0, 2000),
      reflectionText ? reflectionText.slice(0, 2000) : null,
      recordingUrl && recordingUrl.startsWith('/uploads/recordings/') ? recordingUrl : null
    );

  res.status(201).json({ id: info.lastInsertRowid });
});

router.get('/participants/:code/sessions/:sessionNumber', (req, res) => {
  const participant = getParticipantOr404(req.params.code, res);
  if (!participant) return;
  const row = db
    .prepare('SELECT session_number, started_at, completed_at FROM session_log WHERE participant_id = ? AND session_number = ?')
    .get(participant.id, Number(req.params.sessionNumber));
  res.json(row || { session_number: Number(req.params.sessionNumber), started_at: null, completed_at: null });
});

router.get('/participants/:code/sessions/:sessionNumber/responses', (req, res) => {
  const participant = getParticipantOr404(req.params.code, res);
  if (!participant) return;
  const rows = db
    .prepare(
      'SELECT * FROM exposure_responses WHERE participant_id = ? AND session_number = ? ORDER BY exposure_level ASC'
    )
    .all(participant.id, Number(req.params.sessionNumber));
  res.json(rows);
});

// Marks a session complete and advances the participant's current session
// pointer. Does NOT change exposure level/intensity — that is entirely
// determined by the researcher's session-plan configuration.
router.post('/participants/:code/sessions/:sessionNumber/complete', (req, res) => {
  const participant = getParticipantOr404(req.params.code, res);
  if (!participant) return;
  const sessionNumber = Number(req.params.sessionNumber);
  const settings = getConfig('study_settings') || {};

  db.prepare(
    `INSERT INTO session_log (participant_id, session_number, started_at, completed_at)
     VALUES (?, ?, datetime('now'), datetime('now'))
     ON CONFLICT(participant_id, session_number) DO UPDATE SET completed_at = datetime('now')`
  ).run(participant.id, sessionNumber);

  const nextSession = sessionNumber + 1;
  const isLastSession = sessionNumber >= (settings.numSessions || 1);
  if (!isLastSession && participant.current_session_number <= sessionNumber) {
    db.prepare(`UPDATE participants SET current_session_number = ?, updated_at = datetime('now') WHERE id = ?`).run(
      nextSession,
      participant.id
    );
  }

  res.json({ ok: true, isLastSession, nextSession: isLastSession ? null : nextSession });
});

export default router;
