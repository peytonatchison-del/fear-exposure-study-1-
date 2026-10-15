import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { useStudy } from '../context/StudyContext.jsx';
import useCountdown from '../hooks/useCountdown.js';

// Short, researcher-written "before your next session" suggestions, tailored
// per fear category. These are generic practice ideas, not individualized
// clinical advice — editable here until a dashboard-editable version exists.
const CATEGORY_ADVICE = {
  spiders:
    'Before your next session, try just noticing (without avoiding) if you come across a spider or a spiderweb in ' +
    'your day-to-day environment, you don’t have to do anything else, just notice it and see how your anxiety moves.',
  heights:
    'Before your next session, try spending a minute or two somewhere moderately elevated you already visit often ' +
    '(a balcony, a stairwell landing, an upper floor) and notice how your anxiety changes the longer you stay.',
  dogs:
    'Before your next session, if you’re around a dog you know is friendly and on a leash, try standing near it ' +
    'for a minute without approaching or retreating, and notice what you expect versus what happens.',
  public_speaking:
    'Before your next session, try speaking up once in a low-stakes group setting, answering a question in class, ' +
    'or saying something in a group chat or meeting, and notice how it compares to what you expected.',
  flying:
    'Before your next session, try watching a short real takeoff/landing video or visiting an airport-adjacent ' +
    'space if one is nearby, and notice how your anxiety moves as the material gets more “real.”',
  college_admissions:
    'Before your next session, try noticing when thoughts about admissions decisions, tuition, or your friends’ ' +
    'plans come up during your day, you don’t have to act on them, just notice when they show up and how ' +
    'intense they feel.',
  test_anxiety:
    'Before your next session, try noticing how you feel the next time a low-stakes quiz, pop quiz, or graded ' +
    'assignment comes up at school, and see how that compares to what you expected going in.',
};
const DEFAULT_ADVICE =
  'Before your next session, try noticing moments related to this fear as they come up in daily life, without ' +
  'avoiding or over-preparing for them, just notice what you expect versus what actually happens.';

// Deliberately does NOT show participants their own before/after numbers or
// any chart of their ratings. Showing that back to them risked turning the
// study into something participants could "play" — answering to move a
// number or a chart in a particular direction — rather than reporting how
// they actually felt. The ratings are still collected exactly as before;
// they're just never redisplayed here.
export default function SessionSummary() {
  const navigate = useNavigate();
  const { sessionNumber: sessionParam } = useParams();
  const sessionNumber = Number(sessionParam);
  const { participant, protocol } = useStudy();
  // A mandatory 5-second wait — resets if the session number changes —
  // before "Continue" becomes clickable, so the tips are actually read
  // rather than clicked past immediately.
  const secondsLeft = useCountdown(5, sessionNumber);
  const ready = secondsLeft <= 0;

  if (!participant) {
    navigate('/participant-code');
    return null;
  }

  function handleContinue() {
    const numSessions = protocol?.numSessions || 1;
    const nextSession = sessionNumber + 1;
    if (sessionNumber >= numSessions) {
      // The final assessment can be scheduled on its own date, independent
      // of the last regular session's date.
      const finalDate = protocol?.finalAssessmentDate;
      if (finalDate) {
        const availableAt = new Date(`${finalDate}T00:00:00Z`).getTime();
        if (Date.now() < availableAt) {
          navigate(`/between-sessions?availableAt=${availableAt}&session=final`);
          return;
        }
      }
      navigate('/final-assessment');
      return;
    }
    // A scheduled calendar date for the next session (set by the researcher)
    // takes priority over the legacy days-between-sessions countdown.
    const scheduledDate = protocol?.sessionSchedule?.[String(nextSession)];
    if (scheduledDate) {
      const availableAt = new Date(`${scheduledDate}T00:00:00Z`).getTime();
      if (Date.now() < availableAt) {
        navigate(`/between-sessions?availableAt=${availableAt}&session=${nextSession}`);
        return;
      }
      navigate(`/exposure-intro?session=${nextSession}`);
      return;
    }
    if ((protocol?.daysBetweenSessions || 0) > 0) {
      const availableAt = Date.now() + (protocol.daysBetweenSessions || 0) * 86400000;
      navigate(`/between-sessions?availableAt=${availableAt}&session=${nextSession}`);
    } else {
      navigate(`/exposure-intro?session=${nextSession}`);
    }
  }

  return (
    <Layout>
      <div className="card">
        <h1 className="screen-title">Session {sessionNumber} Complete</h1>
        <p className="lead">Your responses for this session have been recorded. Thank you for participating.</p>

        <div className="disclaimer-banner" style={{ background: 'var(--calm-teal-soft)', borderColor: '#bfe6d5', color: '#0b5d3f' }}>
          <strong>Before your next session:</strong>{' '}
          {CATEGORY_ADVICE[participant?.fearCategoryId] || DEFAULT_ADVICE}
        </div>

        <p className="sim-portal-hint">{ready ? 'You may continue.' : `You can continue in ${secondsLeft}s`}</p>
        <div className="btn-row">
          <button className="btn btn-primary" disabled={!ready} onClick={handleContinue}>
            Continue
          </button>
        </div>
      </div>
    </Layout>
  );
}
