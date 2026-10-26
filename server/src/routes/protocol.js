import { Router } from 'express';
import { db, getConfig, getAppMode } from '../db/index.js';

const router = Router();

// Everything here is PUBLIC and read-only — it's what the participant-facing
// app needs to render screens 1-9 using whatever the researcher has
// currently configured. No participant identifiers are required to call it.

router.get('/protocol', (req, res) => {
  const categories = (getConfig('fear_categories') || []).filter((c) => c.active);
  const questionnaireItems = (getConfig('questionnaire_items') || []).filter((q) => q.active);
  const settings = getConfig('study_settings') || {};
  res.json({
    appMode: getAppMode(),
    categories,
    questionnaireItems,
    numSessions: settings.numSessions,
    daysBetweenSessions: settings.daysBetweenSessions,
    sessionSchedule: settings.sessionSchedule || {},
    finalAssessmentDate: settings.finalAssessmentDate || '',
    defaultExposureDurationSeconds: settings.defaultExposureDurationSeconds,
    irbApproved: !!settings.irbApproved,
    consentText: settings.consentText || '',
  });
});

router.get('/app-mode', (req, res) => {
  const settings = getConfig('study_settings') || {};
  res.json({ appMode: getAppMode(), irbApproved: !!settings.irbApproved });
});

function levelsForSession(sessionNumber, settings) {
  const map = settings.sessionLevelMap || {};
  if (map[sessionNumber]) return map[sessionNumber];
  if (map[String(sessionNumber)]) return map[String(sessionNumber)];
  return settings.defaultLevelsPerSession || [1];
}

// Returns the ordered list of exposure levels (with their stimulus) for a
// given session number + fear category, exactly as the researcher configured
// it. The app never decides this on its own.
router.get('/protocol/session-plan', (req, res) => {
  const sessionNumber = Number(req.query.sessionNumber);
  const categoryId = String(req.query.categoryId || '');
  const isDemo = req.query.demo === '1' ? 1 : 0;
  if (!sessionNumber || !categoryId) {
    return res.status(400).json({ error: 'sessionNumber and categoryId are required.' });
  }
  const settings = getConfig('study_settings') || {};
  const levels = levelsForSession(sessionNumber, settings);

  const stmt = db.prepare(
    'SELECT id, category_id, level, content_type, content, caption, duration_seconds, audience_video_path, audience_video_credit, rejection_letter_path, interview_video_path FROM stimuli WHERE category_id = ? AND level = ? AND is_demo = ?'
  );
  const plan = levels.map((level) => {
    const stimulus = stmt.get(categoryId, level, isDemo) || stmt.get(categoryId, level, 0);
    // Convert the raw sqlite row (snake_case columns) to the camelCase shape
    // the participant-facing screens expect (see ExposureSession.jsx).
    const serializedStimulus = stimulus
      ? {
          id: stimulus.id,
          categoryId: stimulus.category_id,
          level: stimulus.level,
          contentType: stimulus.content_type,
          content: stimulus.content,
          caption: stimulus.caption,
          durationSeconds: stimulus.duration_seconds,
          audienceVideoUrl: stimulus.audience_video_path || null,
          audienceVideoCredit: stimulus.audience_video_credit || null,
          rejectionLetterUrl: stimulus.rejection_letter_path || null,
          interviewVideoUrl: stimulus.interview_video_path || null,
        }
      : null;
    return {
      level,
      stimulus: serializedStimulus,
      durationSeconds: (stimulus && stimulus.duration_seconds) || settings.defaultExposureDurationSeconds || 30,
    };
  });
  res.json({ sessionNumber, categoryId, levels: plan });
});

export default router;
