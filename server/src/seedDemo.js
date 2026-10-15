// Populates the database with fake, clearly-labeled demo data so the app and
// dashboard can be explored end-to-end without any real participants.
// Every row this script creates has is_demo = 1 and is excluded from real
// exports unless the researcher explicitly asks to include demo data.
import 'dotenv/config';
import { db, getConfig } from './db/index.js';
import { generateUniqueStudyCode } from './utils/codeGenerator.js';

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
// Ratings are on a 1-10 scale (matching the participant-facing sliders).
function clamp(n) {
  return Math.max(1, Math.min(10, Math.round(n)));
}
// GAD-7 items are answered on their own standard 0-3 frequency scale
// ("Not at all" ... "Nearly every day"), separate from the 1-10 rating scale.
function randGad7() {
  return randInt(0, 3);
}

const categories = (getConfig('fear_categories') || []).filter((c) => c.active);
const settings = getConfig('study_settings') || {};
const numSessions = settings.numSessions || 4;

const insertParticipant = db.prepare(
  'INSERT INTO participants (study_code, fear_category_id, is_demo, consent_ack, current_session_number, status) VALUES (?, ?, 1, 1, ?, ?)'
);
const insertAssessment = db.prepare(
  'INSERT INTO assessments (participant_id, phase, anxiety_now, fear_rating, questionnaire_json) VALUES (?, ?, ?, ?, ?)'
);
const insertExposure = db.prepare(
  `INSERT INTO exposure_responses
    (participant_id, fear_category_id, session_number, exposure_level, pre_rating, during_rating, post_rating, expected_text, actual_text)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
);
const insertSessionLog = db.prepare(
  `INSERT OR IGNORE INTO session_log (participant_id, session_number, started_at, completed_at) VALUES (?, ?, datetime('now'), datetime('now'))`
);

const seed = db.transaction(() => {
  const demoCount = 10;
  for (let i = 0; i < demoCount; i += 1) {
    const category = categories[i % categories.length];
    const code = generateUniqueStudyCode(db);
    // Each fake participant gets a randomized "trend" so the dashboard shows
    // a realistic mix rather than a uniform story: some trend down, some flat,
    // some noisy/up — this is fake demo data, not a claim about real results.
    const trend = ['down', 'flat', 'noisy'][i % 3];
    const startAnxiety = randInt(6, 9);
    const startFear = randInt(6, 10);

    const info = insertParticipant.run(code, category.id, numSessions, 'completed');
    const participantId = info.lastInsertRowid;

    const gad7Baseline = {
      gad7_1: randGad7(),
      gad7_2: randGad7(),
      gad7_3: randGad7(),
      gad7_4: randGad7(),
      gad7_5: randGad7(),
      gad7_6: randGad7(),
      gad7_7: randGad7(),
    };
    insertAssessment.run(participantId, 'baseline', startAnxiety, startFear, JSON.stringify(gad7Baseline));

    for (let session = 1; session <= numSessions; session += 1) {
      insertSessionLog.run(participantId, session);
      const level = Math.min(5, session);
      const drift = trend === 'down' ? -session : trend === 'noisy' ? randInt(-2, 2) : randInt(0, 1);
      const pre = clamp(startAnxiety + drift + randInt(-1, 1));
      const post = clamp(pre - randInt(1, 3));
      // The participant-facing app no longer asks a separate "during"
      // question (removed as redundant) — the during_rating column mirrors
      // post_rating, same as the real submission flow does.
      const during = post;
      insertExposure.run(
        participantId,
        category.id,
        session,
        level,
        pre,
        during,
        post,
        'Demo response: expected to feel very anxious.',
        'Demo response: felt manageable after a short time.'
      );
    }

    const finalDrift = trend === 'down' ? -3 : trend === 'noisy' ? randInt(-2, 2) : randInt(-1, 0);
    const gad7Final = {
      gad7_1: randGad7(),
      gad7_2: randGad7(),
      gad7_3: randGad7(),
      gad7_4: randGad7(),
      gad7_5: randGad7(),
      gad7_6: randGad7(),
      gad7_7: randGad7(),
    };
    insertAssessment.run(
      participantId,
      'final',
      clamp(startAnxiety + finalDrift),
      clamp(startFear + finalDrift),
      JSON.stringify(gad7Final)
    );
  }
});

seed();
// eslint-disable-next-line no-console
console.log(`Seeded demo data for ${categories.length ? 10 : 0} fake participants across ${categories.length} categories.`);
