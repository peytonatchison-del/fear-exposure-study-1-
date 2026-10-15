# Online Fear Exposure Research Study — Data Collection Platform

A web application built for a high-school science-fair research project studying whether a
standardized, online exposure-based protocol is associated with changes in self-reported fear.

**This is a research data-collection tool, not a therapy or treatment app.** It does not
diagnose anyone, does not claim to treat/cure/prevent anxiety or phobias, and never decides on
its own that a participant should move to a harder exposure level — every part of the protocol
(categories, session schedule, exposure levels, timing, and the actual stimuli shown) is set by
the researcher and can be changed at any time from the dashboard.

**Before any real participant uses this app, the study protocol must receive IRB (Institutional
Review Board) approval, and the app's configuration must match exactly what was approved.** The
researcher dashboard has a dedicated "IRB Checklist" tab that technically blocks real-participant
data collection until every item is confirmed.

---

## 1. What's in this project

```
fear-exposure-study/
├── server/            Node/Express API + SQLite database
│   ├── src/
│   │   ├── db/            schema.sql + default protocol config
│   │   ├── routes/         all API endpoints
│   │   ├── middleware/     researcher auth (JWT)
│   │   ├── utils/          study-code generator, descriptive stats
│   │   ├── index.js        server entry point
│   │   └── seedDemo.js     populates fake demo data
│   ├── uploads/stimuli/    uploaded images/video (created automatically)
│   └── data/               study.sqlite database file (created automatically)
├── client/            React (Vite) frontend
│   └── src/
│       ├── screens/        the 9 participant-facing screens + help/withdraw
│       ├── researcher/     the password-protected researcher dashboard
│       ├── components/     shared UI (sliders, layout, progress bar, forms)
│       └── context/        participant + protocol state
└── package.json       convenience scripts to run both at once
```

The architecture is deliberately simple — one Express server, one SQLite file, one React app —
so a student researcher can read every file and understand what it does without a framework
tutorial. There's no build pipeline beyond Vite's default, no ORM, and configuration lives in a
handful of JSON blobs in the database rather than a migrations system.

## 2. Running it locally

You'll need [Node.js](https://nodejs.org) 18 or later.

```bash
# 1. Install dependencies for both the server and the client
npm run install:all

# 2. Configure the server
cp server/.env.example server/.env
# then open server/.env and set RESEARCHER_INITIAL_PASSWORD to something only you know

# 3. Start both the API server and the client dev server together
npm run dev
```

This starts:
- the API server at **http://localhost:4000**
- the client app at **http://localhost:5173**

Open http://localhost:5173 for the participant flow, or http://localhost:5173/researcher/login
for the researcher dashboard (username `researcher`, password = whatever you set as
`RESEARCHER_INITIAL_PASSWORD`).

The database (`server/data/study.sqlite`) and default protocol configuration (six fear
categories, placeholder/starter stimuli, a generic questionnaire, a 4-session schedule) are
created automatically the first time the server starts. If you already had the server running
before this category was added, it's added automatically the next time you restart it (`npm run
dev`) — no need to delete your database.

The participant Welcome screen also has a small "If you're a researcher, click here" link at the
bottom that goes straight to `/researcher/login`, so you don't have to type the URL by hand.

### Loading demo data

To explore the researcher dashboard's charts and tables without doing the participant flow
yourself ten times, seed some fake, clearly-labeled demo data:

```bash
npm run seed:demo
```

This creates 10 fake participants (flagged `is_demo`, never exported by default, and removable
any time from the "Participants" tab → "Clear All Demo Data"). Every screen in the participant
app also shows a yellow **DEMO MODE** banner whenever the current study code was created in demo
mode, so demo and real data are never visually confused.

## 3. DEMO mode vs. REAL study mode

The server has one switch, `APP_MODE`, in `server/.env`:

- **`APP_MODE=demo`** (the default) — the only way to create a participant is a demo
  participant. This is the safe mode for development, testing, and showing the app to people
  before IRB approval is in hand.
- **`APP_MODE=real`** — real participants can register **only if** the IRB Checklist in the
  dashboard has been fully completed (see below). Demo participants can still be created at any
  time in either mode, for testing.

This is enforced on the server (`server/src/routes/participants.js`), not just hidden in the UI,
so it can't be bypassed by someone poking at the API directly.

## 4. Before collecting real data: the IRB checklist

Open the dashboard → **IRB Checklist** tab. Real-participant registration stays blocked until
every item is checked and saved:

1. The full study protocol has IRB approval.
2. The consent/assent language on the Consent screen matches exactly what the IRB approved.
3. Every exposure stimulus (Stimuli tab) is the exact approved material — no placeholders left.
4. The session schedule, exposure durations, and questionnaire items match the approved protocol.
5. The Help/Emergency screen content has been reviewed for this participant population.

Only once all five are checked (and `APP_MODE=real` is set in `server/.env`, which requires a
server restart) will real-participant registration be allowed.

## 5. Configuring the study protocol

Everything below is editable from the researcher dashboard — nothing requires touching code:

- **Protocol tab** — fear categories (add/rename/deactivate; the six defaults are Spiders,
  Heights/Roller Coasters, Dogs, Public Speaking, Flying, and Checking College Admission
  Decisions), the baseline/final questionnaire items, the number of sessions, days between
  sessions, default exposure duration, which exposure level(s) appear in which session number,
  and the Consent/Information text.
- **Stimuli tab** — for every category × level (1–5) combination, upload an approved image or
  video, enter a URL/text passage, or (new) choose an **Interactive Simulation**. Nothing is ever
  chosen automatically — whatever is configured here is exactly what participants see. Levels
  left as the default `[Approved stimulus for ... — replace after IRB approval]` placeholder are
  obvious and are meant to be replaced before real data collection.

  Interactive simulations are small, self-paced, mockups (built with React, not real websites or
  real recording) used as an exposure stimulus in place of a static image/video/text. Because
  they're self-paced, there's no fixed minimum-viewing timer for this stimulus type the way there
  is for images/video/text — each simulation controls its own pacing and calls forward to the
  post-exposure rating questions when the participant is done.

  Two categories currently use a full 4-session interactive progression (seeded automatically,
  levels 1–4, least-to-most demanding):
  - **Checking College Admission Decisions** — an applicant-portal notification the participant
    opens (never reveals an actual decision), a group-chat scenario where a friend's plans change,
    and a financial-aid/tuition-balance page (see `AdmissionsPortalSim.jsx`, `TextThreadSim.jsx`,
    `FinancialAidEmailSim.jsx`).
  - **Public Speaking** — a short narrative building up to a presentation (no speaking required),
    then reading a preset passage aloud to a small simulated classroom audience with a flexible
    "+10 seconds" countdown timer, then a larger audience with a longer, more complex script shown
    in a continuously scrolling teleprompter, then answering a randomly-assigned personal question
    in the participant's own words on camera with a live microphone level meter (see
    `PublicSpeakingNarrativeSim.jsx`, `AudienceReadAloud.jsx`, `PublicSpeakingAudienceSim.jsx`,
    `PublicSpeakingTeleprompterSim.jsx`, `PublicSpeakingOwnResponseSim.jsx`). The camera/microphone
    session (Level 4) shows a clear disclaimer before requesting browser permissions, and — like
    every part of this app — never records, saves, or transmits any audio or video; the live
    preview and sound meter exist only in the participant's own browser.
- **IRB Checklist tab** — see above.
- **Participants / Overview & Data / Export tabs** — read-only views of collected data,
  descriptive-statistics charts, and CSV export. No names, emails, or other identifying
  information are ever collected — participants are identified only by an anonymous, randomly
  generated study code.

## 6. Data collected (and not collected)

Per response, the app stores: study code, fear category, session number, exposure level,
timestamp, pre-/post-exposure ratings (1–10), the two short free-text responses ("what did you
expect / what actually happened"), and — for session 2 onward — a free-text reflection on what's
happened related to this fear since the last session and how the participant dealt with it. A
"during" rating is also stored for backward compatibility, but is no longer asked as a separate
question — it's simply a copy of the post-exposure rating. Baseline and final assessments store
the same 1–10 ratings plus the questionnaire answers.

The app never asks for a name, email, phone number, address, or any other identifying
information. CSV exports (Export tab) are keyed only by study code.

## 7. Descriptive statistics only

The Overview & Data tab shows six charts (baseline vs. final fear, baseline vs. final anxiety,
before/during/after per exposure level, anxiety across sessions, individual participant
trajectories, and aggregate results by category), each with a "Show table" toggle for the raw
mean/median/SD/n numbers. Deliberately, **the app does not run any significance testing (t-tests,
p-values, etc.) and never states that anxiety "improved" or that the exposure "worked."** That
interpretation is left to the researcher (and, ideally, actual statistical analysis) — this tool
just organizes and displays what participants reported.

## 8. Safety

Every participant-facing screen has a persistent "Need help / Stop" button in the header, which
leads to a screen that tells participants to stop if they're significantly distressed, that this
is not a treatment or emergency service, and how to reach a trusted adult, 911 (or their local
emergency number), or the 988 Suicide & Crisis Lifeline (US). From there they can also formally
withdraw from the study at any time.

## 9. Production notes

This is set up for local/classroom use with `npm run dev`. It's also set up to deploy as a single
service (Railway, or anything similar that runs `npm run build` then `npm start`):

- `npm run build` (root) installs both `server` and `client` dependencies and builds the client
  into `client/dist/`. `npm start` (root) then runs the Express server, which serves that built
  client itself alongside the `/api` and `/uploads` routes — one service, one URL, no separate
  hosting/CORS setup needed. `railway.json` at the project root already points Railway at these
  two commands.
- **Persistent storage matters.** Most hosts (Railway included) wipe anything not on a mounted
  persistent volume every time the app restarts or redeploys — including the SQLite database.
  Set `DATA_DIR` and `UPLOADS_DIR` (see `server/.env.example`) to paths under a mounted volume
  before collecting any real data, e.g. a volume mounted at `/data` with `DATA_DIR=/data/db` and
  `UPLOADS_DIR=/data/uploads`. Without this, a redeploy or restart can silently erase every
  participant response.
- Set a long, random `JWT_SECRET` and a strong `RESEARCHER_INITIAL_PASSWORD` as environment
  variables before going live, and change the researcher password from the dashboard afterward.
  Don't commit real secrets into `server/.env` — that file is gitignored on purpose; set these as
  environment variables in your host's dashboard instead.
- Back up the database on the persistent volume regularly once real data collection begins.
- Talk to your IRB/school about hosting requirements (HTTPS, data retention, etc.) — this
  project doesn't make hosting decisions for you.
