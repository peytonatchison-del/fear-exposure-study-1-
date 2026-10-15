import React from 'react';
import useCountdown from '../hooks/useCountdown.js';

// Session 1 (Level 1) for the Public Speaking category — the least demanding
// exposure in this category's progression. A short, gradually-escalating
// narrative about a student approaching a presentation, told in exactly 5
// slides. Each slide has a mandatory 10-second cooldown before "Continue"
// becomes clickable — the participant has to wait the full 10 seconds every
// time, there's no way to skip ahead. The participant only reads and waits —
// no speaking. The story deliberately stops right as the student is about to
// begin speaking; the actual speaking exposure starts in Session 2.
const STORY_BEATS = [
  'It’s a normal morning. You’re getting ready for school, and somewhere in the back of your mind you remember: ' +
    'you have a presentation today. Not right now, though, it’s hours away. You have plenty of time.',
  'Walking into school, you see a few classmates by their lockers. Someone mentions presentations are happening ' +
    'today, and you feel a small flutter in your stomach. You push it aside and head to your first few classes.',
  'By the time your presentation class rolls around, that flutter has grown a little. You take your seat. The teacher ' +
    'pulls up the list of names for today. You quietly count how many people are ahead of you.',
  'One presenter finishes. Then another. Each time someone sits back down, the room gets a little closer to your ' +
    'name being called. Your notes are in your hands. You read the first line to yourself, just to be sure.',
  'The teacher looks down at the list and says your name. You stand up, walk to the front of the room, and turn ' +
    'around to face the class. Everyone is looking at you, waiting. You take a breath.',
];

export default function PublicSpeakingNarrativeSim({ onComplete }) {
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
    <div className="sim-portal" role="group" aria-label="Narrative introduction to a public speaking scenario">
      <div className="sim-portal-disclaimer">
        A short story to read through, you don’t need to speak or do anything else in this session.
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
