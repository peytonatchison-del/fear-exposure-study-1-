import { Router } from 'express';
import { getConfig, setConfig } from '../db/index.js';
import { requireResearcher } from '../middleware/auth.js';

const router = Router();
router.use(requireResearcher);

// Full protocol configuration (including inactive categories/items), for the
// dashboard's editors. This is the single source of truth the participant
// app reads from — editing it here immediately changes what participants see.
router.get('/researcher/protocol', (req, res) => {
  res.json({
    fearCategories: getConfig('fear_categories') || [],
    questionnaireItems: getConfig('questionnaire_items') || [],
    studySettings: getConfig('study_settings') || {},
    protocolMeta: getConfig('protocol_meta') || {},
    appMode: process.env.APP_MODE || 'demo',
  });
});

function bumpVersion() {
  const meta = getConfig('protocol_meta') || { protocolVersion: 0 };
  setConfig('protocol_meta', { ...meta, protocolVersion: (meta.protocolVersion || 0) + 1 });
}

router.put('/researcher/categories', (req, res) => {
  const { categories } = req.body || {};
  if (!Array.isArray(categories)) return res.status(400).json({ error: 'categories must be an array.' });
  for (const c of categories) {
    if (!c.id || !c.name) return res.status(400).json({ error: 'Each category needs at least an id and name.' });
  }
  setConfig('fear_categories', categories);
  bumpVersion();
  res.json({ ok: true, fearCategories: categories });
});

router.put('/researcher/questionnaire', (req, res) => {
  const { questionnaireItems } = req.body || {};
  if (!Array.isArray(questionnaireItems)) {
    return res.status(400).json({ error: 'questionnaireItems must be an array.' });
  }
  for (const q of questionnaireItems) {
    if (!q.id || !q.text) return res.status(400).json({ error: 'Each item needs at least an id and text.' });
  }
  setConfig('questionnaire_items', questionnaireItems);
  bumpVersion();
  res.json({ ok: true, questionnaireItems });
});

router.put('/researcher/study-settings', (req, res) => {
  const current = getConfig('study_settings') || {};
  const {
    numSessions,
    daysBetweenSessions,
    sessionSchedule,
    finalAssessmentDate,
    defaultExposureDurationSeconds,
    sessionLevelMap,
    defaultLevelsPerSession,
    consentText,
  } = req.body || {};

  const next = { ...current };
  if (numSessions !== undefined) next.numSessions = Number(numSessions);
  if (daysBetweenSessions !== undefined) next.daysBetweenSessions = Number(daysBetweenSessions);
  if (sessionSchedule !== undefined) {
    if (typeof sessionSchedule !== 'object' || sessionSchedule === null || Array.isArray(sessionSchedule)) {
      return res.status(400).json({ error: 'sessionSchedule must be an object mapping session number to a date.' });
    }
    next.sessionSchedule = sessionSchedule;
  }
  if (finalAssessmentDate !== undefined) {
    if (typeof finalAssessmentDate !== 'string') {
      return res.status(400).json({ error: 'finalAssessmentDate must be a date string (or empty).' });
    }
    next.finalAssessmentDate = finalAssessmentDate;
  }
  if (defaultExposureDurationSeconds !== undefined) {
    next.defaultExposureDurationSeconds = Number(defaultExposureDurationSeconds);
  }
  if (sessionLevelMap !== undefined) next.sessionLevelMap = sessionLevelMap;
  if (defaultLevelsPerSession !== undefined) next.defaultLevelsPerSession = defaultLevelsPerSession;
  if (consentText !== undefined) next.consentText = consentText;

  setConfig('study_settings', next);
  bumpVersion();
  res.json({ ok: true, studySettings: next });
});

// The IRB checklist. Real-participant data collection stays blocked
// (enforced server-side in routes/participants.js) until irbApproved=true.
router.put('/researcher/irb-checklist', (req, res) => {
  const current = getConfig('study_settings') || {};
  const { checklist, irbProtocolNumber, irbApprovalDate } = req.body || {};
  const requiredKeys = [
    'protocolApprovedByIrb',
    'consentAssentApprovedByIrb',
    'exposureMaterialsApprovedByIrb',
    'appConfigurationMatchesApprovedProtocol',
    'emergencyProcedureReviewed',
  ];
  const allChecked = requiredKeys.every((k) => checklist && checklist[k] === true);

  const next = {
    ...current,
    irbChecklist: checklist || current.irbChecklist || {},
    irbProtocolNumber: irbProtocolNumber ?? current.irbProtocolNumber ?? '',
    irbApprovalDate: irbApprovalDate ?? current.irbApprovalDate ?? '',
    irbApproved: allChecked,
  };
  setConfig('study_settings', next);
  bumpVersion();
  res.json({ ok: true, studySettings: next });
});

export default router;
