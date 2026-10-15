import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db, getConfig } from '../db/index.js';
import { signResearcherToken, requireResearcher } from '../middleware/auth.js';

const router = Router();

function researcherDisplayName() {
  return (getConfig('study_settings') || {}).researcherDisplayName || null;
}

router.post('/researcher/login', (req, res) => {
  const { username, password } = req.body || {};
  const researcher = db.prepare('SELECT * FROM researchers WHERE username = ?').get(username || 'researcher');
  if (!researcher || !bcrypt.compareSync(password || '', researcher.password_hash)) {
    return res.status(401).json({ error: 'Incorrect username or password.' });
  }
  const token = signResearcherToken(researcher);
  res.json({ token, username: researcher.username, displayName: researcherDisplayName() });
});

router.get('/researcher/me', requireResearcher, (req, res) => {
  res.json({ username: req.researcher.username, displayName: researcherDisplayName() });
});

router.post('/researcher/change-password', requireResearcher, (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  const researcher = db.prepare('SELECT * FROM researchers WHERE id = ?').get(req.researcher.sub);
  if (!researcher || !bcrypt.compareSync(currentPassword || '', researcher.password_hash)) {
    return res.status(401).json({ error: 'Current password is incorrect.' });
  }
  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters.' });
  }
  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE researchers SET password_hash = ? WHERE id = ?').run(hash, researcher.id);
  res.json({ ok: true });
});

export default router;
