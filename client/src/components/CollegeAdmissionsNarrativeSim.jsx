import React from 'react';
import useCountdown from '../hooks/useCountdown.js';

// Session 1 (Level 1) for the Checking College Admission Decisions category —
// the least demanding exposure in this category's progression. A short,
// gradually-escalating narrative about a student approaching the moment they
// check their admission decision, told in exactly 5 slides. Each slide has a
// mandatory 10-second cooldown before "Continue" becomes clickable — the
// participant has to wait the full 10 seconds every time, there's no way to
// skip ahead. The participant only reads and waits — nothing to click or
// check yet. The story deliberately stops right as the decision is about to
// be revealed; the actual interactive portal exposure starts in Session 2.
const STORY_BEATS = [
  'It’s a normal morning. Somewhere in the back of your mind, you’re aware that college admission decisions are ' +
    'being released around now. You haven’t checked anything yet, it’s not urgent this exact second, you have ' +
    'time.',
  'Later in the day, you see a couple of people online mention that decisions are starting to come out. You feel a ' +
    'small flutter in your stomach. You close the app and tell yourself you’ll check later, when you’re ready.',
  'That evening, you sit down at your computer. You open a new tab and type in the portal’s web address, then pause ' +
    'with your cursor hovering over the login button, not clicking it yet.',
  'You log in. The dashboard loads. Near the top of the page, there’s a small notification icon next to ' +
    '“Messages,” showing one unread item. You haven’t clicked it yet, but you know it’s sitting there.',
  'You move your cursor over the notification. Your heart is beating a little faster. Whatever the message says, ' +
    'it’s one click away now.',
];

export default function CollegeAdmissionsNarrativeSim({ onComplete }) {
  const [index, setIndex] = React.useState(0);
  const isLast = index === STORY_BEATS.length - 1;
  // Resets to a fresh 10s wait every time the slide changes.
  const secondsLeft = useCountdown(10, index);
  const ready = secondsLeft <= 0;

  function handleContinue() {
    if (!ready) return;
    if (isLast) {
      onComplete();
    } else {
      setIndex((i) => i + 1);
    }
  }

  return (
    <div className="sim-portal" role="group" aria-label="Narrative introduction to a college admission decision scenario">
      <div className="sim-portal-disclaimer">
        A short story to read through, you don’t need to check or click anything else in this session.
      </div>

      <div className="sim-narrative-window">
        <p className="sim-narrative-text">{STORY_BEATS[index]}</p>
        <p className="sim-portal-hint">{ready ? 'You may continue.' : `You can continue in ${secondsLeft}s`}</p>
        <div className="btn-row">
          <button type="button" className="btn btn-primary" disabled={!ready} onClick={handleContinue}>
            {isLast ? 'Continue' : 'Keep Reading'}
          </button>
        </div>
        <p className="sim-portal-hint">
          Slide {index + 1} of {STORY_BEATS.length}
        </p>
      </div>
    </div>
  );
}
