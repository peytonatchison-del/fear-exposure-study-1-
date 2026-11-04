import { api } from '../api.js';

// SQLite's datetime('now') returns "YYYY-MM-DD HH:MM:SS" (UTC, space
// separator). Convert to a strict ISO string before parsing — some browsers
// won't reliably parse the space-separated form.
function completedAtMs(sqliteTimestamp) {
  return new Date(`${sqliteTimestamp.replace(' ', 'T')}Z`).getTime();
}

// For "rolling" session timing: given when the previous session (or
// baseline, for session 1 — though session 1 is never gated this way) was
// completed, returns when the next one unlocks and when that window closes.
// extraHours adds on top of the researcher's configured rollingWindowHours —
// that's where an approved "more time" request (see extensionHoursFor below)
// gets applied, stacking additively onto the normal window. Exported so
// BetweenSessions/SessionExpired can be given the same numbers without
// recomputing them differently.
export function rollingWindowFor(prevCompletedAtSqlite, protocol, extraHours = 0) {
  const unlockMs = (protocol?.rollingUnlockHours ?? 24) * 3600000;
  const windowMs = ((protocol?.rollingWindowHours ?? 72) + (extraHours || 0)) * 3600000;
  const availableAt = completedAtMs(prevCompletedAtSqlite) + unlockMs;
  return { availableAt, expiresAt: availableAt + windowMs };
}

// Total extra hours a researcher has approved for one specific session
// (sessionLabel is a session number as a string, or "final") — every
// approved request for that session stacks, so granting time twice just
// adds up. Pending/denied requests contribute nothing.
async function extensionHoursFor(studyCode, sessionLabel) {
  const requests = await api.getExtensionRequests(studyCode);
  return requests
    .filter((r) => r.sessionLabel === sessionLabel && r.status === 'approved')
    .reduce((sum, r) => sum + (r.grantedHours || 0), 0);
}

// Works out where a participant should land next, whether they just created
// a code or are returning to resume a later session. Centralizing this in
// one place keeps the individual screens simple.
export async function resolveResumeRoute(participant, protocol) {
  if (!participant) return '/';
  if (participant.status === 'withdrawn') return '/withdrawn';
  if (!participant.fearCategoryId) return '/fear-category';

  const assessments = await api.getAssessments(participant.studyCode);
  const hasBaseline = assessments.some((a) => a.phase === 'baseline');
  const hasFinal = assessments.some((a) => a.phase === 'final');
  if (!hasBaseline) return '/baseline';
  if (hasFinal || participant.status === 'completed') return '/complete';

  const numSessions = protocol?.numSessions || 1;
  const sessionNumber = Math.min(participant.currentSessionNumber, numSessions);
  const rolling = protocol?.sessionTimingMode === 'rolling';

  if (participant.currentSessionNumber > numSessions) {
    if (rolling) {
      const prevStatus = await api.getSessionStatus(participant.studyCode, numSessions);
      if (prevStatus.completed_at) {
        const extraHours = await extensionHoursFor(participant.studyCode, 'final');
        const { availableAt, expiresAt } = rollingWindowFor(prevStatus.completed_at, protocol, extraHours);
        if (Date.now() < availableAt) return `/between-sessions?availableAt=${availableAt}&expiresAt=${expiresAt}&session=final`;
        if (Date.now() > expiresAt) return `/session-expired?session=final&closedAt=${expiresAt}`;
      }
      return '/final-assessment';
    }
    // The final assessment can be scheduled on its own date, independent of
    // the last regular session's date.
    const finalDate = protocol?.finalAssessmentDate;
    if (finalDate) {
      // No "Z" — local midnight in the participant's own browser, not UTC
      // midnight, so a scheduled date always means 12:00 AM that day for
      // whoever is looking at the screen.
      const availableAt = new Date(`${finalDate}T00:00:00`).getTime();
      if (Date.now() < availableAt) {
        return `/between-sessions?availableAt=${availableAt}&session=final`;
      }
    }
    return '/final-assessment';
  }

  // Session 1 is never gated here — it's only gated by studyOpenDate, back
  // on the Baseline screen, same in both timing modes. From Session 2
  // onward: in rolling mode, each session's window is computed fresh off
  // the previous session's completion time; in calendar mode, a scheduled
  // date for this session (set by the researcher) takes priority over the
  // legacy days-between-sessions countdown.
  if (sessionNumber > 1) {
    const prevStatus = await api.getSessionStatus(participant.studyCode, sessionNumber - 1);
    const currentStatus = await api.getSessionStatus(participant.studyCode, sessionNumber);
    const alreadyStarted = !!currentStatus.started_at;

    if (rolling) {
      if (!alreadyStarted && prevStatus.completed_at) {
        const extraHours = await extensionHoursFor(participant.studyCode, String(sessionNumber));
        const { availableAt, expiresAt } = rollingWindowFor(prevStatus.completed_at, protocol, extraHours);
        if (Date.now() < availableAt) return `/between-sessions?availableAt=${availableAt}&expiresAt=${expiresAt}&session=${sessionNumber}`;
        if (Date.now() > expiresAt) return `/session-expired?session=${sessionNumber}&closedAt=${expiresAt}`;
      }
    } else {
      const scheduledDate = protocol?.sessionSchedule?.[String(sessionNumber)];
      const waitDays = protocol?.daysBetweenSessions || 0;
      let availableAt = null;
      if (scheduledDate) {
        availableAt = new Date(`${scheduledDate}T00:00:00`).getTime(); // local midnight, see note above
      } else if (prevStatus.completed_at && waitDays > 0) {
        availableAt = completedAtMs(prevStatus.completed_at) + waitDays * 86400000;
      }
      if (availableAt !== null && !alreadyStarted && Date.now() < availableAt) {
        return `/between-sessions?availableAt=${availableAt}&session=${sessionNumber}`;
      }
    }
  }

  return `/exposure-intro?session=${sessionNumber}`;
}
