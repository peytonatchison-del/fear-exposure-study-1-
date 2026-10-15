-- Fear-Exposure Research Study database schema.
-- SQLite. Kept deliberately simple (flat tables, JSON text columns for
-- researcher-configurable structures) so a student researcher can read,
-- extend, or export it without needing to learn a migration framework.

-- Single-row-per-key configuration store. Values are JSON text.
-- Keys used by this app: 'fear_categories', 'questionnaire_items',
-- 'study_settings', 'protocol_meta'.
CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Researcher dashboard login. Single-researcher by default; more rows can be
-- added by hand or by extending the /researcher/users route.
CREATE TABLE IF NOT EXISTS researchers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Approved exposure stimuli, one row per (fear category, level). Content is
-- either a placeholder string (pre-IRB), an uploaded file path, or an
-- external URL, depending on "content_type".
CREATE TABLE IF NOT EXISTS stimuli (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id TEXT NOT NULL,
  level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 5),
  content_type TEXT NOT NULL DEFAULT 'placeholder', -- placeholder | image | video | url | text
  content TEXT NOT NULL,           -- placeholder text, file path (served from /uploads), or URL
  caption TEXT,                    -- optional short label shown above the stimulus
  duration_seconds INTEGER,        -- optional override of the default exposure timer for this level
  audience_video_path TEXT,        -- optional researcher-uploaded video used as the audience backdrop (Public Speaking Sessions 2-3)
  audience_video_credit TEXT,      -- optional short attribution line shown under the audience video to participants
  is_demo INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(category_id, level, is_demo)
);

-- One row per participant. No names/contact info are ever stored here.
CREATE TABLE IF NOT EXISTS participants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  study_code TEXT NOT NULL UNIQUE,
  fear_category_id TEXT,
  is_demo INTEGER NOT NULL DEFAULT 0,
  consent_ack INTEGER NOT NULL DEFAULT 0,
  current_session_number INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'in_progress', -- in_progress | completed | withdrawn
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Baseline (phase='baseline') and end-of-study (phase='final') assessments.
CREATE TABLE IF NOT EXISTS assessments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  participant_id INTEGER NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  phase TEXT NOT NULL CHECK (phase IN ('baseline', 'final')),
  anxiety_now INTEGER NOT NULL CHECK (anxiety_now BETWEEN 0 AND 100),
  fear_rating INTEGER NOT NULL CHECK (fear_rating BETWEEN 0 AND 100),
  questionnaire_json TEXT NOT NULL DEFAULT '{}', -- { itemId: response }
  questionnaire_total INTEGER, -- sum of questionnaire answers (GAD-7: 0-21)
  helped_most TEXT,     -- qualitative reflection, phase='final' only
  could_improve TEXT,   -- qualitative reflection, phase='final' only
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- One row per exposure trial (a single level shown within a session).
CREATE TABLE IF NOT EXISTS exposure_responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  participant_id INTEGER NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  fear_category_id TEXT NOT NULL,
  session_number INTEGER NOT NULL,
  exposure_level INTEGER NOT NULL CHECK (exposure_level BETWEEN 1 AND 5),
  stimulus_id INTEGER REFERENCES stimuli(id),
  pre_rating INTEGER NOT NULL CHECK (pre_rating BETWEEN 0 AND 100),
  during_rating INTEGER NOT NULL CHECK (during_rating BETWEEN 0 AND 100),
  post_rating INTEGER NOT NULL CHECK (post_rating BETWEEN 0 AND 100),
  expected_text TEXT,
  actual_text TEXT,
  reflection_text TEXT, -- optional free-text: "what's happened related to this fear since last session"
  recording_url TEXT, -- optional uploaded audio/video response (Public Speaking Session 4), researcher-only
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Tracks session-level scheduling/completion, used to gate repeat sessions.
CREATE TABLE IF NOT EXISTS session_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  participant_id INTEGER NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  session_number INTEGER NOT NULL,
  started_at TEXT,
  completed_at TEXT,
  UNIQUE(participant_id, session_number)
);

CREATE INDEX IF NOT EXISTS idx_exposure_participant ON exposure_responses(participant_id);
CREATE INDEX IF NOT EXISTS idx_assessments_participant ON assessments(participant_id);
CREATE INDEX IF NOT EXISTS idx_stimuli_category_level ON stimuli(category_id, level);
