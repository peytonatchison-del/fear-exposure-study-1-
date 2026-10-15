import React from 'react';
import useCountdown from '../hooks/useCountdown.js';

// Session 1 (Level 1) for the Test-Taking category — the least demanding
// exposure in this category's progression. A short, gradually-escalating
// narrative about a student approaching a test, told in exactly 5 slides.
// Each slide has a mandatory 10-second cooldown before "Continue" becomes
// clickable — the participant has to wait the full 10 seconds every time,
// there's no way to skip ahead. The participant only reads and waits — no
// actual test-taking. The story deliberately stops right as the test paper
// lands on the desk; the actual test-taking exposure starts in Session 2.
const STORY_BEATS = [
  'It’s a normal morning. You’re getting ready for school, and somewhere in the back of your mind you remember: ' +
    'you have a test today. Not right now, though, it’s hours away. You have plenty of time.',
  'Walking into school, you overhear a couple of classmates quizzing each other in the hallway, going over notes one ' +
    'more time. You feel a small flutter in your stomach. You push it aside and head to your first few classes.',
  'By the time the class with the test rolls around, that flutter has grown a little. You take your seat. The ' +
    'teacher is stacking a pile of papers on the desk at the front of the room, facedown, ready to hand out.',
  'The teacher starts making their way down the rows, placing a paper on each desk. Around you, a few people are ' +
    'already flipping pencils in their hands or double-checking they have an eraser. The stack gets smaller.',
  'A paper lands on your desk, facedown. The teacher says you may begin. You look around, a few people have ' +
    'already flipped theirs over and started writing. You put your hand on the corner of the page.',
];

export default function TestAnxietyNarrativeSim({ onComplete }) {
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
    <div className="sim-portal" role="group" aria-label="Narrative introduction to a test-taking scenario">
      <div className="sim-portal-disclaimer">
        A short story to read through, you don’t need to answer anything or do anything else in this session.
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
