import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { UPLOADS_DIR } from './config/paths.js';

import protocolRoutes from './routes/protocol.js';
import participantRoutes from './routes/participants.js';
import assessmentRoutes from './routes/assessments.js';
import exposureRoutes from './routes/exposure.js';
import researcherAuthRoutes from './routes/researcherAuth.js';
import researcherProtocolRoutes from './routes/researcherProtocol.js';
import researcherStimuliRoutes from './routes/researcherStimuli.js';
import researcherDataRoutes from './routes/researcherData.js';
import researcherExportRoutes from './routes/researcherExport.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Ensure the uploads directory exists on first boot — matters most when
// UPLOADS_DIR points at a freshly-mounted, empty persistent volume.
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(UPLOADS_DIR));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, appMode: process.env.APP_MODE || 'demo', time: new Date().toISOString() });
});

app.use('/api', protocolRoutes);
app.use('/api', participantRoutes);
app.use('/api', assessmentRoutes);
app.use('/api', exposureRoutes);
app.use('/api', researcherAuthRoutes);
app.use('/api', researcherProtocolRoutes);
app.use('/api', researcherStimuliRoutes);
app.use('/api', researcherDataRoutes);
app.use('/api', researcherExportRoutes);

// In production, this server also serves the already-built React client
// (client/dist), so the whole app is one deployable service with no CORS
// or separate-hostname setup needed — the client's fetch calls are already
// same-origin relative paths (see client/src/api.js). Locally, `npm run
// dev` runs the client through its own Vite dev server instead, and
// client/dist won't exist yet, so this block simply does nothing until you
// run `npm run build:client`.
const CLIENT_DIST = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
    res.sendFile(path.join(CLIENT_DIST, 'index.html'));
  });
}

// Central error handler — keeps stack traces out of API responses while
// still surfacing a useful message (e.g. multer file-type rejections).
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Unexpected server error.' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`\n  Fear-Exposure Research Study API running on http://localhost:${PORT}`);
  // eslint-disable-next-line no-console
  console.log(`  Mode: ${(process.env.APP_MODE || 'demo').toUpperCase()}\n`);
});
