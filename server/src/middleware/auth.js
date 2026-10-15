import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'insecure-dev-secret-change-me';

export function signResearcherToken(researcher) {
  return jwt.sign({ sub: researcher.id, username: researcher.username, role: 'researcher' }, SECRET, {
    expiresIn: '12h',
  });
}

export function requireResearcher(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing researcher credentials.' });
  try {
    const payload = jwt.verify(token, SECRET);
    if (payload.role !== 'researcher') throw new Error('bad role');
    req.researcher = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
  }
}
