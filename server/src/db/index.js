import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DATA_DIR } from '../config/paths.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(DATA_DIR, 'study.sqlite');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
db.exec(schema);

// Column-level migration for databases created before the end-of-study
// qualitative reflection fields existed on `assessments`. SQLite's
// CREATE TABLE IF NOT EXISTS above only affects brand-new databases, so an
// existing one needs these two nullable columns added explicitly. Safe to
// run every startup — it's a no-op once the columns exist.
(function migrateAddAssessmentReflectionColumns() {
  const columns = db.prepare('PRAGMA table_info(assessments)').all().map((c) => c.name);
  if (!columns.includes('helped_most')) db.exec('ALTER TABLE assessments ADD COLUMN helped_most TEXT');
  if (!columns.includes('could_improve')) db.exec('ALTER TABLE assessments ADD COLUMN could_improve TEXT');
  // Sum of the standardized questionnaire (GAD-7) answers for this
  // assessment, 0-21 when all 7 items are answered on the standard 0-3
  // scale. Null if the questionnaire section was empty/skipped.
  if (!columns.includes('questionnaire_total')) db.exec('ALTER TABLE assessments ADD COLUMN questionnaire_total INTEGER');
})();

// Column-level migration for databases created before the "since your last
// session" reflection question existed on `exposure_responses`. Same
// pattern as above — safe to run every startup, a no-op once the column
// exists, and never touches any data already collected.
(function migrateAddExposureReflectionColumn() {
  const columns = db.prepare('PRAGMA table_info(exposure_responses)').all().map((c) => c.name);
  if (!columns.includes('reflection_text')) db.exec('ALTER TABLE exposure_responses ADD COLUMN reflection_text TEXT');
})();

// Column-level migration: lets a researcher upload their own classroom/
// audience video to use as the visual backdrop for the Public Speaking
// Session 2 simulation, stored separately from content/content_type so it
// never interferes with the 'simulation' lookup key those columns hold.
(function migrateAddStimuliAudienceVideoColumn() {
  const columns = db.prepare('PRAGMA table_info(stimuli)').all().map((c) => c.name);
  if (!columns.includes('audience_video_path')) db.exec('ALTER TABLE stimuli ADD COLUMN audience_video_path TEXT');
})();

// Column-level migration: a short attribution line ("Video courtesy of ...")
// shown as small subtext under a researcher-uploaded audience video, so real
// source footage can be credited on screen.
(function migrateAddStimuliAudienceVideoCreditColumn() {
  const columns = db.prepare('PRAGMA table_info(stimuli)').all().map((c) => c.name);
  if (!columns.includes('audience_video_credit')) db.exec('ALTER TABLE stimuli ADD COLUMN audience_video_credit TEXT');
})();

// Column-level migration: lets a researcher upload their own admission-
// decision rejection letter (an image of the actual letter) to be revealed
// at the end of the College Admissions Session 3 email/envelope simulation.
// Stored separately from content/content_type, same pattern as
// audience_video_path above, so it never interferes with the 'simulation'
// lookup key those columns hold. The app never generates this letter itself
// — it stays null (and the simulation shows a placeholder) until a
// researcher uploads one from the Stimuli tab.
(function migrateAddStimuliRejectionLetterColumn() {
  const columns = db.prepare('PRAGMA table_info(stimuli)').all().map((c) => c.name);
  if (!columns.includes('rejection_letter_path')) db.exec('ALTER TABLE stimuli ADD COLUMN rejection_letter_path TEXT');
})();

// Column-level migration: lets a researcher upload their own fake interview
// video, used as the main scene for the Applying for a Job Session 4 live-
// interview simulation (the participant's own camera is layered on top of it
// as a picture-in-picture box — see JobApplicationLiveInterviewSim.jsx).
// Stored separately from content/content_type, same pattern as
// audience_video_path above. The app never generates this video itself — it
// stays null (and the simulation shows a placeholder) until a researcher
// uploads one from the Stimuli tab.
(function migrateAddStimuliInterviewVideoColumn() {
  const columns = db.prepare('PRAGMA table_info(stimuli)').all().map((c) => c.name);
  if (!columns.includes('interview_video_path')) db.exec('ALTER TABLE stimuli ADD COLUMN interview_video_path TEXT');
})();

// Column-level migration: a short attribution line ("Interviewer video
// courtesy of ...") shown as small subtext under the researcher-uploaded
// interview video, same idea as audience_video_credit above, so real source
// footage can be credited on screen.
(function migrateAddStimuliInterviewVideoCreditColumn() {
  const columns = db.prepare('PRAGMA table_info(stimuli)').all().map((c) => c.name);
  if (!columns.includes('interview_video_credit')) db.exec('ALTER TABLE stimuli ADD COLUMN interview_video_credit TEXT');
})();

// Column-level migration: stores the uploaded path to a participant's Public
// Speaking Session 4 audio/video response, once real recording (viewed only
// by the researcher, per the study's consent language) was approved for that
// session.
(function migrateAddExposureRecordingColumn() {
  const columns = db.prepare('PRAGMA table_info(exposure_responses)').all().map((c) => c.name);
  if (!columns.includes('recording_url')) db.exec('ALTER TABLE exposure_responses ADD COLUMN recording_url TEXT');
})();

// ---------------------------------------------------------------------------
// Default configuration seeded on first run. All of this is editable later
// from the researcher dashboard (Protocol / Categories / Stimuli screens) —
// nothing here is hard-coded into the application logic.
// ---------------------------------------------------------------------------

const DEFAULT_CATEGORIES = [
  { id: 'spiders', name: 'Spiders', description: 'Images and video related to spiders.', active: true },
  { id: 'heights', name: 'Heights / Roller Coasters', description: 'Images and video related to heights and roller coasters.', active: true },
  { id: 'dogs', name: 'Dogs', description: 'Images and video related to dogs.', active: true },
  {
    id: 'public_speaking',
    name: 'Public Speaking',
    description: 'Text scenarios and interactive simulations related to speaking in front of others.',
    active: true,
  },
  { id: 'flying', name: 'Flying', description: 'Images and video related to air travel.', active: true },
  {
    id: 'college_admissions',
    name: 'Applying for a Job',
    description: 'Simulations related to applying for a job, interviewing, and negotiating an offer.',
    active: true,
  },
  {
    id: 'test_anxiety',
    name: 'Test-Taking',
    description: 'Text scenarios and interactive simulated tests related to taking exams and other academic assessments.',
    active: true,
  },
];

// The GAD-7 (Generalized Anxiety Disorder 7-item scale, Spitzer/Kroenke/
// Williams), adapted to name the participant's chosen fear category in each
// item (each "{topic}" placeholder is filled in client-side — see
// client/src/utils/fearTopics.js — with a phrase like "public speaking"),
// rather than asking about anxiety in general. It is only ever shown twice
// per participant — once at baseline (Screen 4) and once at the final
// assessment (Screen 9) — never per-session, so pre/post scores can be
// compared. Answers use the instrument's standard 4-point frequency scale
// (0-3); see QuestionnaireTable.jsx for the click-table UI and
// assessments.js for how the 0-21 total is computed and stored.
// Editable from the researcher dashboard's Protocol tab, but editing the
// wording deviates further from the validated instrument (which this is
// already a topic-specific adaptation of).
const DEFAULT_QUESTIONNAIRE_ITEMS = [
  { id: 'gad7_1', text: 'Feeling nervous, anxious, or on edge when thinking about {topic}', active: true },
  { id: 'gad7_2', text: 'Not being able to stop or control worrying about {topic}', active: true },
  { id: 'gad7_3', text: 'Worrying too much about {topic}', active: true },
  { id: 'gad7_4', text: 'Trouble relaxing because of thoughts about {topic}', active: true },
  { id: 'gad7_5', text: 'Feeling so restless about {topic} that it is hard to sit still', active: true },
  { id: 'gad7_6', text: 'Becoming easily annoyed or irritable when thinking about {topic}', active: true },
  { id: 'gad7_7', text: 'Feeling afraid that something awful related to {topic} might happen', active: true },
];

// The original, non-topic-specific wording — kept only so
// migrateGad7ToTopicSpecific (below) can detect a database that still has
// this exact old wording saved and safely upgrade it, without ever
// overwriting a researcher's own custom edits.
const OLD_GAD7_ITEMS = [
  { id: 'gad7_1', text: 'Feeling nervous, anxious, or on edge', active: true },
  { id: 'gad7_2', text: 'Not being able to stop or control worrying', active: true },
  { id: 'gad7_3', text: 'Worrying too much about different things', active: true },
  { id: 'gad7_4', text: 'Trouble relaxing', active: true },
  { id: 'gad7_5', text: 'Being so restless that it is hard to sit still', active: true },
  { id: 'gad7_6', text: 'Becoming easily annoyed or irritable', active: true },
  { id: 'gad7_7', text: 'Feeling afraid, as if something awful might happen', active: true },
];

const DEFAULT_STUDY_SETTINGS = {
  numSessions: 4,
  // Legacy fallback only — kept so nothing breaks for a study that was
  // already relying on it. The researcher dashboard now schedules specific
  // calendar dates per session instead (see sessionSchedule below), which
  // takes priority whenever a date is set for the session in question.
  daysBetweenSessions: 7,
  // Maps a session number (as a string key, e.g. "2") to the ISO date
  // ("YYYY-MM-DD") on which that session becomes available to everyone —
  // set from the dashboard's Session Schedule tab. Session 1 is never in
  // here (it's available as soon as the baseline assessment is done). A
  // session number with no entry here falls back to daysBetweenSessions
  // instead, so a partially-filled-in schedule still works.
  sessionSchedule: {},
  // The calendar date ("YYYY-MM-DD") the final assessment (GAD-7 + wrap-up)
  // becomes available, set independently from the last regular session's
  // date — so the final assessment doesn't have to fall on the same day a
  // participant finishes session N. Empty string means no separate date is
  // set, and the final assessment opens immediately after the last session.
  finalAssessmentDate: '',
  defaultExposureDurationSeconds: 30,
  // Friendly name shown in the researcher dashboard sidebar (under a
  // "Researcher" label), separate from the login username. Left blank by
  // default so no name is displayed anywhere in the portal.
  researcherDisplayName: '',
  // Internal one-time-migration flag — see seedOrMigrateCollegeAdmissionsStimuli below.
  collegeAdmissionsStructureV2: false,
  // Internal one-time-migration flag — see migrateToGad7Questionnaire below.
  questionnaireGad7V1: false,
  // Internal one-time-migration flag — see seedOrMigratePublicSpeakingStimuli below.
  publicSpeakingStructureV1: false,
  // Internal one-time-migration flag — see migrateToVaguePublicSpeakingDescription below.
  publicSpeakingDescriptionV2: false,
  // Internal one-time-migration flag — see seedPublicSpeakingVideoCredit below.
  publicSpeakingVideoCreditV1: false,
  // Internal one-time-migration flag — see migrateReorderPublicSpeakingSessions below.
  publicSpeakingSessionOrderV1: false,
  // Internal one-time-migration flag — see migrateReorderPublicSpeakingSessionsBack below.
  publicSpeakingSessionOrderV2: false,
  // Internal one-time-migration flag — see seedOrMigrateTestAnxietyStimuli below.
  testAnxietyStructureV1: false,
  // Internal one-time-migration flag — see migrateCollegeAdmissionsLevel1ToNarrative below.
  collegeAdmissionsNarrativeV1: false,
  // Internal one-time-migration flag — see migrateGad7ToTopicSpecific below.
  questionnaireGad7TopicV1: false,
  // Internal one-time-migration flag — see migrateToVagueCollegeAdmissionsDescription below.
  collegeAdmissionsDescriptionV2: false,
  // Internal one-time-migration flag — see migrateCollegeAdmissionsSessionsV3 below.
  collegeAdmissionsStructureV3: false,
  // Internal one-time-migration flag — see migrateCollegeAdmissionsJobApplicationV1 below.
  collegeAdmissionsJobApplicationV1: false,
  // Which exposure levels (1-5) are shown during each session number.
  // Editable in the dashboard's "Session Schedule" tab. Extra session
  // numbers beyond what's listed here fall back to `defaultLevelsPerSession`.
  sessionLevelMap: { 1: [1], 2: [2], 3: [3], 4: [4] },
  defaultLevelsPerSession: [5],
  irbApproved: false,
  irbProtocolNumber: '',
  irbApprovalDate: '',
  // Shown on the Welcome/Research Information/Consent screens. Replace this
  // placeholder with the exact information/consent (or assent) language
  // approved by the IRB before collecting any real participant data.
  consentText:
    '[PLACEHOLDER — replace with the exact study information sheet and consent/assent language approved by the IRB.]\n\n' +
    'This study is looking at whether a standardized, online exposure activity is associated with changes in how ' +
    'anxious or fearful people say they feel. Participation is voluntary. You will be asked to rate your anxiety ' +
    'and fear on simple 0-100 scales before, during, and after viewing standardized digital material related to a ' +
    'fear category you choose. You may stop at any time without penalty. No name, email, or other identifying ' +
    'information will be collected — only an anonymous study code. This app does not provide medical or mental ' +
    'health treatment, and the people running the study cannot see how you are feeling in real time. If you become ' +
    'significantly distressed, stop and contact a trusted adult or appropriate professional (see the Help screen).',
};

function seedConfig(key, value) {
  const existing = db.prepare('SELECT key FROM config WHERE key = ?').get(key);
  if (!existing) {
    db.prepare('INSERT INTO config (key, value) VALUES (?, ?)').run(key, JSON.stringify(value));
  }
}

seedConfig('fear_categories', DEFAULT_CATEGORIES);
seedConfig('questionnaire_items', DEFAULT_QUESTIONNAIRE_ITEMS);
seedConfig('study_settings', DEFAULT_STUDY_SETTINGS);
seedConfig('protocol_meta', { protocolVersion: 1, lastModified: new Date().toISOString() });

// One-time migration for databases created before the "Checking College
// Admission Decisions" category existed: append it to whatever category
// list is already saved (which may include researcher edits) rather than
// overwriting it. Safe to run on every startup — it's a no-op once the
// category is present.
(function migrateAddCollegeAdmissionsCategory() {
  const existingCategories = getConfig('fear_categories') || [];
  if (!existingCategories.some((c) => c.id === 'college_admissions')) {
    const defaults = DEFAULT_CATEGORIES.find((c) => c.id === 'college_admissions');
    setConfig('fear_categories', [...existingCategories, defaults]);
  }
})();

// One-time migration for databases created before the "Test-Taking" category
// existed: append it to whatever category list is already saved (which may
// include researcher edits) rather than overwriting it. Same pattern as
// migrateAddCollegeAdmissionsCategory above — safe to run on every startup,
// a no-op once the category is present.
(function migrateAddTestAnxietyCategory() {
  const existingCategories = getConfig('fear_categories') || [];
  if (!existingCategories.some((c) => c.id === 'test_anxiety')) {
    const defaults = DEFAULT_CATEGORIES.find((c) => c.id === 'test_anxiety');
    setConfig('fear_categories', [...existingCategories, defaults]);
  }
})();

// One-time migration for databases created before researcherDisplayName
// existed on study_settings — add it without touching any other setting the
// researcher may have already edited.
(function migrateAddResearcherDisplayName() {
  const settings = getConfig('study_settings') || {};
  if (settings.researcherDisplayName === undefined) {
    setConfig('study_settings', { ...settings, researcherDisplayName: DEFAULT_STUDY_SETTINGS.researcherDisplayName });
  }
})();

// One-time migration: the old default researcherDisplayName ('Peyton
// Atchison') shipped hardcoded and there's no dashboard field to edit it, so
// any database that still has that exact old default gets it blanked out —
// nothing else in study_settings is touched.
(function migrateBlankResearcherDisplayName() {
  const settings = getConfig('study_settings') || {};
  if (settings.researcherDisplayName === 'Peyton Atchison') {
    setConfig('study_settings', { ...settings, researcherDisplayName: '' });
  }
})();

// One-time migration that force-replaces whatever questionnaire items are
// currently saved with the real GAD-7 items, now that GAD-7 usage has been
// approved. Guarded by a flag (like seedOrMigrateCollegeAdmissionsStimuli
// below) so it only overwrites the old generic placeholder items ONCE —
// any questionnaire edits a researcher makes afterward, from the dashboard,
// are left alone on every future startup.
(function migrateToGad7Questionnaire() {
  const settings = getConfig('study_settings') || {};
  if (settings.questionnaireGad7V1) return;
  setConfig('questionnaire_items', DEFAULT_QUESTIONNAIRE_ITEMS);
  setConfig('study_settings', { ...(getConfig('study_settings') || {}), questionnaireGad7V1: true });
})();

// One-time migration upgrading the GAD-7 items from their original generic
// wording to the topic-specific version above (each item now names the
// participant's fear category via a "{topic}" placeholder, filled in
// client-side). Only overwrites the saved items if they still hold the
// exact old wording, so a researcher's own custom edits are never touched —
// same guarded-overwrite pattern used for the public_speaking description
// migration below.
(function migrateGad7ToTopicSpecific() {
  const settings = getConfig('study_settings') || {};
  if (settings.questionnaireGad7TopicV1) return;

  const current = getConfig('questionnaire_items') || [];
  if (JSON.stringify(current) === JSON.stringify(OLD_GAD7_ITEMS)) {
    setConfig('questionnaire_items', DEFAULT_QUESTIONNAIRE_ITEMS);
  }

  setConfig('study_settings', { ...(getConfig('study_settings') || {}), questionnaireGad7TopicV1: true });
})();

// Starter content for the "Checking College Admission Decisions" category —
// built to line up with the standard 4-session schedule (one exposure level
// per session). Levels 2-4 were redesigned after initial launch (see
// migrateCollegeAdmissionsSessionsV3 below for how an already-running
// database gets upgraded to this same structure):
//   Level 1 — interactive 5-slide narrative intro (see
//             CollegeAdmissionsNarrativeSim.jsx).
//   Level 2 — interactive: an animated group text thread where a friend
//             announces he's going to community college instead of UF (see
//             client/src/components/TextThreadSim.jsx).
//   Level 3 — interactive: a fake admissions-office email that opens into an
//             envelope, revealing a rejection letter the researcher uploads
//             themselves from the Stimuli tab — never generated by the app
//             (see client/src/components/CollegeAdmissionsRejectionEmailSim.jsx).
//   Level 4 — interactive: a second group text thread where the participant
//             tells their friends they didn't get in (see
//             client/src/components/CollegeFriendGroupChatRejectionSim.jsx).
//   Level 5 — left as a plain text vignette, unused by the default schedule
//             (only shown if a researcher adds a 5th session).
//
// Levels 1-4 are force-synced to this exact structure exactly ONCE per
// database (guarded by the 'collegeAdmissionsStructureV2' flag below), not
// on every startup — otherwise a researcher's later edits from the Stimuli
// tab would silently get overwritten again on the next restart. Using
// INSERT ... ON CONFLICT DO UPDATE (rather than DELETE + re-INSERT) also
// avoids ever hitting the FOREIGN KEY error a delete-based migration could
// trigger once a level already has participant responses recorded against
// it. Level 5 is only seeded if missing, since it's not part of the default
// 4-session flow.
//
// Like every other seeded stimulus, this is runnable-out-of-the-box demo
// content, not IRB-approved material — review/replace it before real use.
(function seedOrMigrateCollegeAdmissionsStimuli() {
  const settings = getConfig('study_settings') || {};
  if (settings.collegeAdmissionsStructureV2) return; // already applied — leave researcher edits alone

  const upsertCollegeAdmissionsStimulus = db.prepare(`
    INSERT INTO stimuli (category_id, level, content_type, content, caption, is_demo)
    VALUES ('college_admissions', @level, @content_type, @content, @caption, 0)
    ON CONFLICT(category_id, level, is_demo) DO UPDATE SET
      content_type = excluded.content_type,
      content = excluded.content,
      caption = excluded.caption,
      updated_at = datetime('now')
  `);
  const COLLEGE_ADMISSIONS_STIMULI = [
    {
      level: 1,
      content_type: 'simulation',
      caption: 'Checking College Admission Decisions — Level 1 (interactive narrative)',
      content: 'college_admissions_narrative_intro',
    },
    {
      level: 2,
      content_type: 'simulation',
      caption: 'Checking College Admission Decisions — Level 2 (interactive)',
      content: 'college_friend_group_chat',
    },
    {
      level: 3,
      content_type: 'simulation',
      caption: 'Checking College Admission Decisions — Level 3 (interactive)',
      content: 'college_admissions_rejection_email',
    },
    {
      level: 4,
      content_type: 'simulation',
      caption: 'Checking College Admission Decisions — Level 4 (interactive)',
      content: 'college_friend_group_chat_rejection',
    },
  ];
  for (const item of COLLEGE_ADMISSIONS_STIMULI) {
    upsertCollegeAdmissionsStimulus.run(item);
  }
  db.prepare(
    `INSERT OR IGNORE INTO stimuli (category_id, level, content_type, content, caption, is_demo)
     VALUES ('college_admissions', 5, 'text', @content, @caption, 0)`
  ).run({
    caption: 'Checking College Admission Decisions — Level 5 (only shown if a 5th session is added)',
    content:
      'You log into the applicant portal and land on the dashboard. There is a small red notification icon next to ' +
      '"Messages," showing one unread item. You have not clicked it yet, but you know that whatever it says is ' +
      'sitting there, one click away.',
  });

  setConfig('study_settings', { ...(getConfig('study_settings') || {}), collegeAdmissionsStructureV2: true });
})();

// One-time migration for databases where seedOrMigrateCollegeAdmissionsStimuli
// above already ran (so it won't touch Level 1 again): converts Level 1 from
// a plain text vignette into the same 5-slide interactive narrative format
// used by every other category's Level 1 (see
// CollegeAdmissionsNarrativeSim.jsx), for consistency. Only overwrites the
// row if it still holds the exact old default text/type, so a researcher's
// own custom Level 1 content is never touched.
(function migrateCollegeAdmissionsLevel1ToNarrative() {
  const settings = getConfig('study_settings') || {};
  if (settings.collegeAdmissionsNarrativeV1) return;

  const OLD_CONTENT =
    'Picture a college applicant sitting at their desk, thinking in a general way about the fact that admission ' +
    'decisions get released online sometime in the spring. They are not checking anything right now — just aware, ' +
    'in the back of their mind, that at some point they will need to log in and find out.';

  const row = db
    .prepare(`SELECT * FROM stimuli WHERE category_id = 'college_admissions' AND level = 1 AND is_demo = 0`)
    .get();

  if (row && row.content_type === 'text' && row.content === OLD_CONTENT) {
    db.prepare(
      `UPDATE stimuli SET content_type = 'simulation', content = 'college_admissions_narrative_intro',
         caption = 'Checking College Admission Decisions — Level 1 (interactive narrative)', updated_at = datetime('now')
       WHERE id = ?`
    ).run(row.id);
  }

  setConfig('study_settings', { ...(getConfig('study_settings') || {}), collegeAdmissionsNarrativeV1: true });
})();

// One-time migration upgrading College Admissions Levels 2-4 from their
// original content to the redesigned versions above (a friend's community-
// college announcement at Level 2, the admissions-email/rejection-letter
// simulation at Level 3, and the friends' reaction to the rejection at
// Level 4 — replacing the old admissions-portal-decision and financial-aid
// simulations). Each level is only overwritten if it still holds the exact
// old default simulation key, so a researcher's own custom Stimuli edits are
// never touched — same guarded-overwrite pattern used elsewhere in this file
// (e.g. migrateGad7ToTopicSpecific above).
(function migrateCollegeAdmissionsSessionsV3() {
  const settings = getConfig('study_settings') || {};
  if (settings.collegeAdmissionsStructureV3) return;

  const OLD_DEFAULTS = {
    2: 'admissions_portal_uf',
    3: 'college_friend_group_chat',
    4: 'financial_aid_status_uf',
  };
  const NEW_DEFAULTS = {
    2: { content: 'college_friend_group_chat', caption: 'Checking College Admission Decisions — Level 2 (interactive)' },
    3: { content: 'college_admissions_rejection_email', caption: 'Checking College Admission Decisions — Level 3 (interactive)' },
    4: { content: 'college_friend_group_chat_rejection', caption: 'Checking College Admission Decisions — Level 4 (interactive)' },
  };

  for (const level of [2, 3, 4]) {
    const row = db
      .prepare(`SELECT * FROM stimuli WHERE category_id = 'college_admissions' AND level = ? AND is_demo = 0`)
      .get(level);
    if (row && row.content_type === 'simulation' && row.content === OLD_DEFAULTS[level]) {
      db.prepare(
        `UPDATE stimuli SET content = ?, caption = ?, updated_at = datetime('now') WHERE id = ?`
      ).run(NEW_DEFAULTS[level].content, NEW_DEFAULTS[level].caption, row.id);
    }
  }

  setConfig('study_settings', { ...(getConfig('study_settings') || {}), collegeAdmissionsStructureV3: true });
})();

// One-time redesign: the 'college_admissions' category (id kept unchanged so
// no participant data needs to move) is reframed from checking a college
// admission decision to applying for a job — same general shape (an escalating
// real-world evaluative scenario across 4 levels) but a different, more
// universally-applicable context. Unconditionally replaces all 4 levels'
// stimuli with the new job-application simulations (see
// JobApplicationNarrativeSim.jsx, JobApplicationResumeSim.jsx,
// JobApplicationOfferNegotiationSim.jsx, and
// JobApplicationLiveInterviewSim.jsx) and refreshes the category's name/
// description, exactly once — guarded by the flag below, so a researcher's
// later edits from the Stimuli/Categories tabs are never overwritten again
// on a future restart.
(function migrateCollegeAdmissionsJobApplicationV1() {
  const settings = getConfig('study_settings') || {};
  if (settings.collegeAdmissionsJobApplicationV1) return;

  const upsertJobApplicationStimulus = db.prepare(`
    INSERT INTO stimuli (category_id, level, content_type, content, caption, is_demo)
    VALUES ('college_admissions', @level, 'simulation', @content, @caption, 0)
    ON CONFLICT(category_id, level, is_demo) DO UPDATE SET
      content_type = 'simulation',
      content = excluded.content,
      caption = excluded.caption,
      updated_at = datetime('now')
  `);
  const JOB_APPLICATION_STIMULI = [
    { level: 1, content: 'job_application_narrative_intro', caption: 'Applying for a Job — Level 1 (interactive narrative)' },
    { level: 2, content: 'job_application_resume_form', caption: 'Applying for a Job — Level 2 (interactive, résumé form)' },
    { level: 3, content: 'job_application_offer_negotiation', caption: 'Applying for a Job — Level 3 (interactive, offer + negotiation)' },
    { level: 4, content: 'job_application_live_interview', caption: 'Applying for a Job — Level 4 (interactive, live interview)' },
  ];
  for (const item of JOB_APPLICATION_STIMULI) {
    upsertJobApplicationStimulus.run(item);
  }

  // Refresh the category's name/description too, but only if it's still
  // exactly the old college-admissions wording — a researcher's own custom
  // name/description (edited from the Categories tab) is left untouched.
  const categories = getConfig('fear_categories') || [];
  const updatedCategories = categories.map((c) => {
    if (c.id !== 'college_admissions') return c;
    const isOldDefault =
      c.name === 'Checking College Admission Decisions' ||
      c.description === 'Simulations, text, and images related to college admissions.' ||
      c.description === 'A vague, deliberately non-spoiling description of a scenario related to checking a college admission decision.';
    if (!isOldDefault) return c;
    return {
      ...c,
      name: 'Applying for a Job',
      description: 'Simulations related to applying for a job, interviewing, and negotiating an offer.',
    };
  });
  setConfig('fear_categories', updatedCategories);

  setConfig('study_settings', { ...(getConfig('study_settings') || {}), collegeAdmissionsJobApplicationV1: true });
})();

// Starter content for the "Public Speaking" category, matching the standard
// 4-session schedule (one exposure level per session), least-to-most
// demanding:
//   Level 1 — narrative intro: a short story building up to a presentation,
//             no speaking required (see PublicSpeakingNarrativeSim.jsx).
//   Level 2 — a small simulated classroom audience + a short, simple preset
//             passage read aloud, with a flexible +10s countdown timer (see
//             AudienceReadAloud.jsx / PublicSpeakingAudienceSim.jsx).
//   Level 3 — a noticeably larger audience + a longer, more complex script
//             shown in a continuously scrolling teleprompter (see
//             PublicSpeakingTeleprompterSim.jsx).
//   Level 4 — the participant answers a randomly-assigned personal question
//             in their own words on camera, with a live microphone level
//             meter (see PublicSpeakingOwnResponseSim.jsx).
//
// Same migration pattern as college admissions above: force-synced to this
// exact structure exactly ONCE per database (guarded by the
// 'publicSpeakingStructureV1' flag), so a researcher's later edits from the
// Stimuli tab aren't silently overwritten again on a future restart.
(function seedOrMigratePublicSpeakingStimuli() {
  const settings = getConfig('study_settings') || {};
  if (settings.publicSpeakingStructureV1) return; // already applied — leave researcher edits alone

  const upsertPublicSpeakingStimulus = db.prepare(`
    INSERT INTO stimuli (category_id, level, content_type, content, caption, is_demo)
    VALUES ('public_speaking', @level, 'simulation', @content, @caption, 0)
    ON CONFLICT(category_id, level, is_demo) DO UPDATE SET
      content_type = 'simulation',
      content = excluded.content,
      caption = excluded.caption,
      updated_at = datetime('now')
  `);
  const PUBLIC_SPEAKING_STIMULI = [
    { level: 1, caption: 'Public Speaking — Level 1 (interactive narrative)', content: 'public_speaking_narrative_intro' },
    { level: 2, caption: 'Public Speaking — Level 2 (interactive, read aloud)', content: 'public_speaking_audience_readaloud' },
    { level: 3, caption: 'Public Speaking — Level 3 (interactive, teleprompter)', content: 'public_speaking_teleprompter' },
    { level: 4, caption: 'Public Speaking — Level 4 (interactive, on camera)', content: 'public_speaking_own_response' },
  ];
  for (const item of PUBLIC_SPEAKING_STIMULI) {
    upsertPublicSpeakingStimulus.run(item);
  }

  // Also refresh the category's description on an existing database — but
  // only if it still has the old, pre-redesign placeholder text ("Images and
  // video related to speaking in front of others"), so a researcher's own
  // custom wording is never overwritten.
  const categories = getConfig('fear_categories') || [];
  const updatedCategories = categories.map((c) =>
    c.id === 'public_speaking' && c.description === 'Images and video related to speaking in front of others.'
      ? { ...c, description: DEFAULT_CATEGORIES.find((d) => d.id === 'public_speaking').description }
      : c
  );
  setConfig('fear_categories', updatedCategories);

  setConfig('study_settings', { ...(getConfig('study_settings') || {}), publicSpeakingStructureV1: true });
})();

// The public_speaking description above originally spelled out the whole
// 4-session structure (narrative → audience → teleprompter → on-camera),
// which gave away too much before the participant ever started. Swap it for
// the same vague, one-line style used for every other category (see
// college_admissions above) — once, on databases that still have the old
// wording, so a researcher's own custom description is never overwritten.
(function migrateToVaguePublicSpeakingDescription() {
  const settings = getConfig('study_settings') || {};
  if (settings.publicSpeakingDescriptionV2) return;

  const OLD_DESCRIPTION =
    'A 4-session interactive progression: a narrative intro, then reading aloud to a simulated classroom audience of increasing size, then answering a question in your own words on camera.';
  const categories = getConfig('fear_categories') || [];
  const updatedCategories = categories.map((c) =>
    c.id === 'public_speaking' && c.description === OLD_DESCRIPTION
      ? { ...c, description: DEFAULT_CATEGORIES.find((d) => d.id === 'public_speaking').description }
      : c
  );
  setConfig('fear_categories', updatedCategories);

  setConfig('study_settings', { ...(getConfig('study_settings') || {}), publicSpeakingDescriptionV2: true });
})();

// Same idea as migrateToVaguePublicSpeakingDescription above, but for
// college_admissions — its original description spelled out the applicant
// portal, which gave away too much on the welcome/category-selection
// screens before the participant ever started. Swapped for a short, vague
// line, once, only on databases that still have the old wording, so a
// researcher's own custom description is never overwritten.
(function migrateToVagueCollegeAdmissionsDescription() {
  const settings = getConfig('study_settings') || {};
  if (settings.collegeAdmissionsDescriptionV2) return;

  const OLD_DESCRIPTION =
    'Text scenarios and an interactive simulated applicant portal related to checking college admission decisions online.';
  const categories = getConfig('fear_categories') || [];
  const updatedCategories = categories.map((c) =>
    c.id === 'college_admissions' && c.description === OLD_DESCRIPTION
      ? { ...c, description: DEFAULT_CATEGORIES.find((d) => d.id === 'college_admissions').description }
      : c
  );
  setConfig('fear_categories', updatedCategories);

  setConfig('study_settings', { ...(getConfig('study_settings') || {}), collegeAdmissionsDescriptionV2: true });
})();

// One-time default for the on-screen video credit shown under a researcher-
// uploaded audience video (Public Speaking Sessions 2 and 3) — set once to
// the source the researcher provided, editable afterward from the Stimuli
// tab, and never re-applied once set (guarded by the flag below) so a later
// edit is never overwritten on restart.
(function seedPublicSpeakingVideoCredit() {
  const settings = getConfig('study_settings') || {};
  if (settings.publicSpeakingVideoCreditV1) return;

  const DEFAULT_CREDIT = 'Video courtesy of Virtual Reality Public Speaking (YouTube)';
  db.prepare(
    `UPDATE stimuli SET audience_video_credit = ?
     WHERE category_id = 'public_speaking' AND level IN (2, 3) AND is_demo = 0 AND audience_video_credit IS NULL`
  ).run(DEFAULT_CREDIT);

  setConfig('study_settings', { ...(getConfig('study_settings') || {}), publicSpeakingVideoCreditV1: true });
})();

// One-time reorder of the Public Speaking session structure, per researcher
// request: Session 1 (narrative intro) stays put; the "own response, on
// camera" simulation moves to Session 2; the classroom-video read-aloud
// moves to Session 3; the crowd-video teleprompter moves to Session 4.
//
// This swaps each row's content/caption/audience-video fields with the row
// at its new level, rather than changing any row's `level` or `id` — so an
// uploaded audience video and its credit travel with the simulation they
// belong to, and any existing exposure_responses (which reference a
// stimulus by id) are left completely alone. Only touches a caption if it
// still has its own exact old default text, so a researcher's custom
// wording is never overwritten.
(function migrateReorderPublicSpeakingSessions() {
  const settings = getConfig('study_settings') || {};
  if (settings.publicSpeakingSessionOrderV1) return;

  const OLD_CAPTION_BY_CONTENT = {
    public_speaking_audience_readaloud: 'Public Speaking — Level 2 (interactive, read aloud)',
    public_speaking_teleprompter: 'Public Speaking — Level 3 (interactive, teleprompter)',
    public_speaking_own_response: 'Public Speaking — Level 4 (interactive, on camera)',
  };
  const NEW_CAPTION_BY_CONTENT = {
    public_speaking_own_response: 'Public Speaking — Level 2 (interactive, on camera)',
    public_speaking_audience_readaloud: 'Public Speaking — Level 3 (interactive, read aloud)',
    public_speaking_teleprompter: 'Public Speaking — Level 4 (interactive, teleprompter)',
  };

  const rows = db
    .prepare(`SELECT * FROM stimuli WHERE category_id = 'public_speaking' AND is_demo = 0 AND level IN (2, 3, 4)`)
    .all();
  const byLevel = Object.fromEntries(rows.map((r) => [r.level, r]));
  const old2 = byLevel[2];
  const old3 = byLevel[3];
  const old4 = byLevel[4];

  // Only proceed if all three rows are present and hold the expected
  // simulation content — if a researcher already restructured this some
  // other way, leave it alone rather than guessing.
  if (
    old2?.content === 'public_speaking_audience_readaloud' &&
    old3?.content === 'public_speaking_teleprompter' &&
    old4?.content === 'public_speaking_own_response'
  ) {
    const moveContentInto = db.prepare(
      `UPDATE stimuli SET content_type = ?, content = ?, caption = ?, duration_seconds = ?,
         audience_video_path = ?, audience_video_credit = ?, updated_at = datetime('now') WHERE id = ?`
    );
    const carryCaption = (source) =>
      source.caption === OLD_CAPTION_BY_CONTENT[source.content] ? NEW_CAPTION_BY_CONTENT[source.content] : source.caption;

    // Level 2's row keeps its id/level but now shows what used to be Level 4.
    moveContentInto.run(
      old4.content_type,
      old4.content,
      carryCaption(old4),
      old4.duration_seconds,
      old4.audience_video_path,
      old4.audience_video_credit,
      old2.id
    );
    // Level 3's row keeps its id/level but now shows what used to be Level 2.
    moveContentInto.run(
      old2.content_type,
      old2.content,
      carryCaption(old2),
      old2.duration_seconds,
      old2.audience_video_path,
      old2.audience_video_credit,
      old3.id
    );
    // Level 4's row keeps its id/level but now shows what used to be Level 3.
    moveContentInto.run(
      old3.content_type,
      old3.content,
      carryCaption(old3),
      old3.duration_seconds,
      old3.audience_video_path,
      old3.audience_video_credit,
      old4.id
    );
  }

  setConfig('study_settings', { ...(getConfig('study_settings') || {}), publicSpeakingSessionOrderV1: true });
})();

// Second reorder, per a later researcher request: move "own response, on
// camera" back to the last session. Session 1 (narrative) is untouched;
// the classroom-video read-aloud moves back to Session 2 and the crowd-
// video teleprompter back to Session 3 — i.e. undoing
// migrateReorderPublicSpeakingSessions above. Same content-swap technique
// (rows keep their id/level; only what's shown at that level moves), so
// uploaded audience videos/credits and existing exposure_responses are
// unaffected.
(function migrateReorderPublicSpeakingSessionsBack() {
  const settings = getConfig('study_settings') || {};
  if (settings.publicSpeakingSessionOrderV2) return;

  const OLD_CAPTION_BY_CONTENT = {
    public_speaking_own_response: 'Public Speaking — Level 2 (interactive, on camera)',
    public_speaking_audience_readaloud: 'Public Speaking — Level 3 (interactive, read aloud)',
    public_speaking_teleprompter: 'Public Speaking — Level 4 (interactive, teleprompter)',
  };
  const NEW_CAPTION_BY_CONTENT = {
    public_speaking_audience_readaloud: 'Public Speaking — Level 2 (interactive, read aloud)',
    public_speaking_teleprompter: 'Public Speaking — Level 3 (interactive, teleprompter)',
    public_speaking_own_response: 'Public Speaking — Level 4 (interactive, on camera)',
  };

  const rows = db
    .prepare(`SELECT * FROM stimuli WHERE category_id = 'public_speaking' AND is_demo = 0 AND level IN (2, 3, 4)`)
    .all();
  const byLevel = Object.fromEntries(rows.map((r) => [r.level, r]));
  const old2 = byLevel[2];
  const old3 = byLevel[3];
  const old4 = byLevel[4];

  if (
    old2?.content === 'public_speaking_own_response' &&
    old3?.content === 'public_speaking_audience_readaloud' &&
    old4?.content === 'public_speaking_teleprompter'
  ) {
    const moveContentInto = db.prepare(
      `UPDATE stimuli SET content_type = ?, content = ?, caption = ?, duration_seconds = ?,
         audience_video_path = ?, audience_video_credit = ?, updated_at = datetime('now') WHERE id = ?`
    );
    const carryCaption = (source) =>
      source.caption === OLD_CAPTION_BY_CONTENT[source.content] ? NEW_CAPTION_BY_CONTENT[source.content] : source.caption;

    // Level 2's row keeps its id/level but now shows what used to be Level 3.
    moveContentInto.run(
      old3.content_type,
      old3.content,
      carryCaption(old3),
      old3.duration_seconds,
      old3.audience_video_path,
      old3.audience_video_credit,
      old2.id
    );
    // Level 3's row keeps its id/level but now shows what used to be Level 4.
    moveContentInto.run(
      old4.content_type,
      old4.content,
      carryCaption(old4),
      old4.duration_seconds,
      old4.audience_video_path,
      old4.audience_video_credit,
      old3.id
    );
    // Level 4's row keeps its id/level but now shows what used to be Level 2.
    moveContentInto.run(
      old2.content_type,
      old2.content,
      carryCaption(old2),
      old2.duration_seconds,
      old2.audience_video_path,
      old2.audience_video_credit,
      old4.id
    );
  }

  setConfig('study_settings', { ...(getConfig('study_settings') || {}), publicSpeakingSessionOrderV2: true });
})();

// Starter content for the "Test-Taking" category, matching the standard
// 4-session schedule (one exposure level per session), least-to-most
// demanding:
//   Level 1 — narrative intro: a short story building up to sitting down for
//             a test, no test-taking required yet (see
//             TestAnxietyNarrativeSim.jsx).
//   Level 2 — a very easy, low-pressure 5-question multiple-choice quiz with
//             no timer (see TestAnxietyEasyTestSim.jsx).
//   Level 3 — a moderate 10-question multiple-choice test with a visible,
//             extendable 50-second timer (see TestAnxietyModerateTestSim.jsx).
//   Level 4 — a 5-paragraph reading passage on a niche topic followed by an
//             8-question multiple-choice + 2-question written-response test
//             with a visible 2:30 timer, ending on a fake results screen
//             (see TestAnxietyDifficultTestSim.jsx).
//
// Same migration pattern as public speaking above: force-synced to this
// exact structure exactly ONCE per database (guarded by the
// 'testAnxietyStructureV1' flag), so a researcher's later edits from the
// Stimuli tab aren't silently overwritten again on a future restart.
(function seedOrMigrateTestAnxietyStimuli() {
  const settings = getConfig('study_settings') || {};
  if (settings.testAnxietyStructureV1) return; // already applied — leave researcher edits alone

  const upsertTestAnxietyStimulus = db.prepare(`
    INSERT INTO stimuli (category_id, level, content_type, content, caption, is_demo)
    VALUES ('test_anxiety', @level, 'simulation', @content, @caption, 0)
    ON CONFLICT(category_id, level, is_demo) DO UPDATE SET
      content_type = 'simulation',
      content = excluded.content,
      caption = excluded.caption,
      updated_at = datetime('now')
  `);
  const TEST_ANXIETY_STIMULI = [
    { level: 1, caption: 'Test-Taking — Level 1 (interactive narrative)', content: 'test_anxiety_narrative_intro' },
    { level: 2, caption: 'Test-Taking — Level 2 (interactive, easy quiz, untimed)', content: 'test_anxiety_easy_test' },
    { level: 3, caption: 'Test-Taking — Level 3 (interactive, timed moderate test)', content: 'test_anxiety_moderate_test' },
    { level: 4, caption: 'Test-Taking — Level 4 (interactive, timed difficult test)', content: 'test_anxiety_difficult_test' },
  ];
  for (const item of TEST_ANXIETY_STIMULI) {
    upsertTestAnxietyStimulus.run(item);
  }

  setConfig('study_settings', { ...(getConfig('study_settings') || {}), testAnxietyStructureV1: true });
})();

// Seed default (placeholder) stimuli for every category/level combination so
// the participant flow is runnable immediately. Every one of these is an
// obvious bracketed placeholder — never real exposure material — and is
// meant to be replaced from the dashboard's Stimuli Editor after IRB review.
const insertStimulusIfMissing = db.prepare(`
  INSERT OR IGNORE INTO stimuli (category_id, level, content_type, content, caption, is_demo)
  VALUES (@category_id, @level, 'placeholder', @content, @caption, 0)
`);
const levelLabels = ['', 'Level 1 (lowest intensity)', 'Level 2', 'Level 3', 'Level 4', 'Level 5 (highest intensity)'];
for (const cat of DEFAULT_CATEGORIES) {
  for (let level = 1; level <= 5; level += 1) {
    insertStimulusIfMissing.run({
      category_id: cat.id,
      level,
      content: `[Approved stimulus for ${cat.name} ${levelLabels[level]} — replace after IRB approval]`,
      caption: `${cat.name} — ${levelLabels[level]}`,
    });
  }
}

// Seed the researcher account on first run only.
const RESEARCHER_USERNAME = process.env.RESEARCHER_INITIAL_USERNAME || 'researcher';
const RESEARCHER_PASSWORD = process.env.RESEARCHER_INITIAL_PASSWORD || 'change-me-now';
const researcherCount = db.prepare('SELECT COUNT(*) AS n FROM researchers').get().n;
if (researcherCount === 0) {
  const hash = bcrypt.hashSync(RESEARCHER_PASSWORD, 10);
  db.prepare('INSERT INTO researchers (username, password_hash) VALUES (?, ?)').run(RESEARCHER_USERNAME, hash);
  // eslint-disable-next-line no-console
  console.log(
    `\n[setup] Created researcher account "${RESEARCHER_USERNAME}". Password is whatever\n` +
    `        RESEARCHER_INITIAL_PASSWORD was set to in server/.env (change it from the dashboard after logging in).\n`
  );
} else if (RESEARCHER_USERNAME !== 'researcher') {
  // Migration: an existing database still has the original default account
  // ("researcher") but server/.env now configures a different username —
  // rename that one legacy account and reset its password to match, rather
  // than creating a second, duplicate account. Only touches it once (it's a
  // no-op as soon as the rename has happened).
  const legacy = db.prepare('SELECT * FROM researchers WHERE username = ?').get('researcher');
  const alreadyRenamed = db.prepare('SELECT * FROM researchers WHERE username = ?').get(RESEARCHER_USERNAME);
  if (legacy && !alreadyRenamed) {
    const hash = bcrypt.hashSync(RESEARCHER_PASSWORD, 10);
    db.prepare('UPDATE researchers SET username = ?, password_hash = ? WHERE id = ?').run(
      RESEARCHER_USERNAME,
      hash,
      legacy.id
    );
    // eslint-disable-next-line no-console
    console.log(`\n[setup] Renamed researcher account "researcher" to "${RESEARCHER_USERNAME}".\n`);
  }
}

export function getConfig(key) {
  const row = db.prepare('SELECT value FROM config WHERE key = ?').get(key);
  return row ? JSON.parse(row.value) : null;
}

// Whether this server is in DEMO or REAL (live-participant) mode. This used
// to additionally require a separate APP_MODE=real environment variable set
// directly on the host (e.g. in Railway's dashboard) — a manual step nothing
// in the researcher dashboard ever surfaced or set, so completing the IRB
// checklist (which fully controls study_settings.irbApproved, see
// routes/researcherProtocol.js) looked like it should take the study out of
// demo mode but silently didn't. irbApproved is now the single source of
// truth: once every checklist item is confirmed, the server is in real mode,
// no separate environment variable required.
export function getAppMode() {
  const settings = getConfig('study_settings') || {};
  return settings.irbApproved ? 'real' : 'demo';
}

export function setConfig(key, value) {
  db.prepare(
    `INSERT INTO config (key, value, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
  ).run(key, JSON.stringify(value));
  db.prepare(
    `INSERT INTO config (key, value, updated_at) VALUES ('protocol_meta', ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
  ).run(JSON.stringify({
    ...(getConfig('protocol_meta') || {}),
    lastModified: new Date().toISOString(),
  }));
}
