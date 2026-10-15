import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// server/src/config -> up two levels to server/
const SERVER_ROOT = path.resolve(__dirname, '../..');

// Both default to folders inside this repo checkout, which is fine for
// local development (they just live next to the code, exactly like before).
//
// In production on a host with an ephemeral filesystem (Railway, etc.),
// anything NOT on a mounted persistent volume is wiped on every restart
// or redeploy. Set these two environment variables to paths under a
// mounted volume (e.g. DATA_DIR=/data/db, UPLOADS_DIR=/data/uploads, both
// under one volume mounted at /data) so the SQLite database and any
// researcher-uploaded stimulus files survive restarts and redeploys.
export const DATA_DIR = process.env.DATA_DIR || path.join(SERVER_ROOT, 'data');
export const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(SERVER_ROOT, 'uploads');
