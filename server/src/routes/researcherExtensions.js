import { Router } from 'express';
import { db } from '../db/index.js';
import { requireResearcher } from '../middleware/auth.js';

const router = Router();
router.use(requireResearcher);

function researcherExtensionRequest(row) {
  return {
    id: row.id,
    studyCode: row.study_code,
    isDemo: !!row.is_demo,
    sessionLabel: row.session_label,
    note: row.note || '',
    status: row.status,
    grantedHours: row.granted_hours,
    requestedAt: row.requested_at,
    decidedAt: row.decided_at,
  };
}

// Every extension request ever filed, newest first, with the participant's
// study code attached — this is what drives the new "Extension Requests"
// sidebar section. Pending ones sort first regardless of date so they
// don't get buried under a long resolved history.
router.get('/researcher/extension-requests', (req, res) => {
  const rows = db
    .prepare(
      `SELECT er.*, p.study_code, p.is_demo
       FROM extension_requests er
       JOIN participants p ON p.id = er.participant_id
       ORDER BY (er.status = 'pending') DESC, er.requested_at DESC`
    )
    .all();
  res.json(rows.map(researcherExtensionRequest));
});

// Approves or denies one request. Approving requires grantedDays (whole or
// fractional days are fine — it's converted to hours here since that's the
// unit rollingUnlockHours/rollingWindowHours already use) and stacks
// additively with any other approved grant already on file for that same
// participant+session, so granting time twice simply adds up.
router.put('/researcher/extension-requests/:id/decide', (req, res) => {
  const { status, grantedDays } = req.body || {};
  if (status !== 'approved' && status !== 'denied') {
    return res.status(400).json({ error: 'status must be "approved" or "denied".' });
  }
  const existing = db.prepare('SELECT * FROM extension_requests WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Request not found.' });
  if (existing.status !== 'pending') {
    return res.status(409).json({ error: 'This request has already been decided.' });
  }

  let grantedHours = null;
  if (status === 'approved') {
    const days = Number(grantedDays);
    if (!Number.isFinite(days) || days <= 0) {
      return res.status(400).json({ error: 'grantedDays must be a positive number when approving.' });
    }
    grantedHours = Math.round(days * 24);
  }

  db.prepare(
    `UPDATE extension_requests SET status = ?, granted_hours = ?, decided_at = datetime('now') WHERE id = ?`
  ).run(status, grantedHours, existing.id);
  const row = db.prepare('SELECT * FROM extension_requests WHERE id = ?').get(existing.id);
  const participant = db.prepare('SELECT study_code, is_demo FROM participants WHERE id = ?').get(row.participant_id);
  res.json(researcherExtensionRequest({ ...row, study_code: participant.study_code, is_demo: participant.is_demo }));
});

export default router;
