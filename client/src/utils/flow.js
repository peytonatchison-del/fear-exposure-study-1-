import { api } from '../api.js';

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

  if (participant.currentSessionNumber > numSessions) {
    // The final assessment can be scheduled on its own date, independent of
    // the last regular session's date.
    const finalDate = protocol?.finalAssessmentDate;
    if (finalDate) {
      const availableAt = new Date(`${finalDate}T00:00:00Z`).getTime();
      if (Date.now() < availableAt) {
        return `/between-sessions?availableAt=${availableAt}&session=final`;
      }
    }
    return '/final-assessment';
  }

  // If the previous session was completed and a between-session wait is
  // configured, check whether that wait has elapsed yet. A scheduled
  // calendar date for this session (set by the researcher) takes priority
  // over the legacy days-between-sessions countdown.
  if (sessionNumber > 1) {
    const prevStatus = await api.getSessionStatus(participant.studyCode, sessionNumber - 1);
    const scheduledDate = protocol?.sessionSchedule?.[String(sessionNumber)];
    const waitDays = protocol?.daysBetweenSessions || 0;
    let availableAt = null;
    if (scheduledDate) {
      availableAt = new Date(`${scheduledDate}T00:00:00Z`).getTime();
    } else if (prevStatus.completed_at && waitDays > 0) {
      // SQLite's datetime('now') returns "YYYY-MM-DD HH:MM:SS" (UTC, space
      // separator). Convert to a strict ISO string before parsing — some
      // browsers won't reliably parse the space-separated form.
      const isoCompletedAt = `${prevStatus.completed_at.replace(' ', 'T')}Z`;
      availableAt = new Date(isoCompletedAt).getTime() + waitDays * 86400000;
    }
    if (availableAt !== null) {
      const currentStatus = await api.getSessionStatus(participant.studyCode, sessionNumber);
      const alreadyStarted = !!currentStatus.started_at;
      if (!alreadyStarted && Date.now() < availableAt) {
        return `/between-sessions?availableAt=${availableAt}&session=${sessionNumber}`;
      }
    }
  }

  return `/exposure-intro?session=${sessionNumber}`;
}
