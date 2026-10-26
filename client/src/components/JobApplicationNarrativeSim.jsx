import React from 'react';
import useCountdown from '../hooks/useCountdown.js';

// Session 1 (Level 1) for the Applying for a Job category — the least
// demanding exposure in this category's progression. A short, gradually-
// escalating narrative about a student approaching the moment of actually
// submitting a job application, told in exactly 5 slides. Each slide has a
// mandatory 10-second cooldown before "Continue" becomes clickable — the
// participant has to wait the full 10 seconds every time, there's no way to
// skip ahead. The participant only reads and waits — nothing to fill out or
// click yet. The story deliberately stops right as the blank application
// fields appear on screen; the actual résumé-filling exposure starts in
// Session 2 (see JobApplicationResumeSim.jsx).
const STORY_BEATS = [
  'It’s a normal morning. You’re getting ready for your day, and somewhere in the back of your mind you remember: ' +
    'you were going to apply for that job today. Not right now, though, it’s hours away. You have plenty of time.',
  'Later on, you come across the job listing again, still saved in a tab you left open. You feel a small flutter ' +
    'in your stomach, wondering if you’re really qualified for it. You close the tab and tell yourself you’ll get ' +
    'to it soon.',
  'That evening, you sit down at your computer. You open a new tab and pull the listing back up, then pause with ' +
    'your cursor hovering over the “Apply Now” button, not clicking it yet.',
  'You click it. The application page loads. Near the top, it asks you to fill in some information about ' +
    'yourself, like a résumé, right there on the page. You haven’t typed anything yet, but you can see the blank ' +
    'fields waiting.',
  'You move your cursor into the first box. Your heart is beating a little faster. Whatever you write here is ' +
    'about to be read by someone deciding whether to hire you. It’s one click away from being real.',
];

export default function JobApplicationNarrativeSim({ onComplete }) {
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
    <div className="sim-portal" role="group" aria-label="Narrative introduction to a job application scenario">
      <div className="sim-portal-disclaimer">
        A short story to read through, you don’t need to fill out or click anything else in this session.
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
