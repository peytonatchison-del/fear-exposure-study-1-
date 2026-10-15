import React, { useEffect, useRef, useState } from 'react';
import QuizQuestion from './QuizQuestion.jsx';
import useCountdown from '../hooks/useCountdown.js';

// Session 4 (Level 4) for the Test-Taking category — the most demanding
// exposure in this category's progression. The participant first reads a
// short, easy-to-follow essay on a deliberately niche-but-approachable topic
// (something they're unlikely to already know much about, but simple to
// understand), then takes a graded-feeling test on it — 8 multiple-choice
// questions plus 2 short written-response questions. No "+10 seconds" button
// anywhere here — that's Session 3 only.
//
// Two separate, always-visible 1-minute countdowns, each with its own rule:
//   Reading: the participant can click "Continue to Test" any time before
//            the minute is up. If the minute runs out first, they're moved
//            on to the test automatically either way.
//   Test:    submitting (by button, or automatically when time runs out)
//            leads to a fake results screen showing a flat 60%, regardless
//            of what was actually answered.
// The participant has to sit with that fake result for 10 seconds before
// they can continue into the normal post-exposure questions — mirroring the
// mandatory-wait gates used elsewhere in this app.
function useLatest(value) {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}

function formatTime(totalSeconds) {
  const clamped = Math.max(0, totalSeconds);
  const m = Math.floor(clamped / 60);
  const s = clamped % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const ESSAY_SECONDS = 60; // 1 minute to read
const TEST_SECONDS = 60; // 1 minute to answer

const ESSAY_TITLE = 'The Great Molasses Flood';
const ESSAY_PARAGRAPHS = [
  'On January 15, 1919, a giant steel tank stood in the North End neighborhood of Boston, Massachusetts. It ' +
    'belonged to a company that made molasses, and it was holding more than two million gallons of the thick, ' +
    'sticky syrup, enough to fill dozens of swimming pools.',
  'The tank had been built quickly a few years earlier, and it had never really been tested to make sure it was ' +
    'safe. That afternoon, the weather had warmed up fast, and the pressure inside the tank grew too strong for its ' +
    'walls to hold. The tank suddenly burst open with a sound witnesses compared to a train wreck.',
  'A wave of molasses roughly 25 feet high, taller than a two-story building, came rushing down the street. ' +
    'Moving at an estimated 35 miles per hour, it was fast enough that people and horses couldn’t outrun it. The ' +
    'wave knocked buildings off their foundations and even bent the steel beams of an elevated train track.',
  'Twenty-one people were killed and about 150 more were injured, many of them trapped in the thick, heavy syrup, ' +
    'which was much harder to escape than ordinary floodwater. Cleanup took weeks: molasses coated the streets, ' +
    'seeped into people’s basements, and was even tracked into subway cars and telephone booths across the city.',
  'The disaster led investigators to take a much closer look at how the tank had been built, and it became one of ' +
    'the first cases that pushed cities to require an actual engineer to review and sign off on building plans ' +
    'before large structures like it could be built. In that way, a single afternoon in Boston helped shape some of ' +
    'the basic safety rules construction still follows today.',
];

const MC_QUESTIONS = [
  { question: 'In what year did the Great Molasses Flood happen?', options: ['1900', '1919', '1929', '1945'] },
  { question: 'In which U.S. city did the flood take place?', options: ['New York', 'Chicago', 'Boston', 'Philadelphia'] },
  { question: 'What broke and caused the flood?', options: ['A dam', 'A large steel tank', "A ship's hull", 'A water pipe'] },
  { question: 'About how tall was the wave of molasses, according to the essay?', options: ['2 feet', '10 feet', '25 feet', '50 feet'] },
  { question: 'About how fast was the wave moving?', options: ['5 mph', '15 mph', '35 mph', '60 mph'] },
  { question: 'About how many people were killed in the disaster?', options: ['2', '21', '100', '500'] },
  { question: 'Why was the molasses especially dangerous to people caught in it, according to the essay?', options: ['It was on fire', 'It was thick and hard to escape', 'It was toxic to breathe', 'It was electrically charged'] },
  { question: 'What lasting change did the disaster help bring about?', options: ['New molasses recipes', 'Stricter engineering/building-safety rules', 'A new Boston flag', "A change to the city's name"] },
];

export default function TestAnxietyDifficultTestSim({ onComplete }) {
  const [phase, setPhase] = useState('essay'); // essay | test | gradebook
  const [essaySecondsLeft, setEssaySecondsLeft] = useState(ESSAY_SECONDS);
  const [testSecondsLeft, setTestSecondsLeft] = useState(TEST_SECONDS);
  const [mcAnswers, setMcAnswers] = useState(() => new Array(MC_QUESTIONS.length).fill(null));
  const [written1, setWritten1] = useState('');
  const [written2, setWritten2] = useState('');
  const doneReadingRef = useRef(false);
  const doneTestRef = useRef(false);
  const phaseRef = useLatest(phase);

  // Reading timer — only ticks while on the essay phase.
  useEffect(() => {
    if (phase !== 'essay') return undefined;
    const interval = setInterval(() => {
      setEssaySecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  // Moves on to the test automatically the moment the reading minute is up —
  // same as clicking "Continue to Test" early.
  useEffect(() => {
    if (phaseRef.current === 'essay' && essaySecondsLeft === 0 && !doneReadingRef.current) {
      doneReadingRef.current = true;
      setPhase('test');
    }
  }, [essaySecondsLeft, phaseRef]);

  function handleContinueReading() {
    if (doneReadingRef.current) return;
    doneReadingRef.current = true;
    setPhase('test');
  }

  // Test timer — only ticks while on the test phase.
  useEffect(() => {
    if (phase !== 'test') return undefined;
    const interval = setInterval(() => {
      setTestSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  // Auto-submits into the gradebook the moment the clock hits zero, whatever
  // was answered so far.
  useEffect(() => {
    if (phaseRef.current === 'test' && testSecondsLeft === 0 && !doneTestRef.current) {
      doneTestRef.current = true;
      setPhase('gradebook');
    }
  }, [testSecondsLeft, phaseRef]);

  function handleSubmitTest() {
    if (doneTestRef.current) return;
    doneTestRef.current = true;
    setPhase('gradebook');
  }

  if (phase === 'essay') {
    const essayUrgent = essaySecondsLeft <= 10;
    return (
      <div className="sim-portal" role="group" aria-label="Reading passage before a timed test">
        <div className="sim-portal-disclaimer">
          Read the passage below, you can continue whenever you&rsquo;re ready, but once the timer runs out you&rsquo;ll
          move on to the test automatically.
        </div>
        <div className="sim-quiz-essay-window">
          <div className={`sim-quiz-timerbar${essayUrgent ? ' is-urgent' : ''}`} style={{ marginBottom: 16 }}>
            <span className={`sim-quiz-timer${essayUrgent ? ' is-urgent' : ''}`}>{formatTime(essaySecondsLeft)}</span>
          </div>
          <h3 className="sim-portal-section-title">{ESSAY_TITLE}</h3>
          {ESSAY_PARAGRAPHS.map((p, i) => (
            <p key={i} className="sim-quiz-essay-paragraph">
              {p}
            </p>
          ))}
          <div className="btn-row">
            <button type="button" className="btn btn-primary" onClick={handleContinueReading}>
              Continue to Test
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'test') {
    const urgent = testSecondsLeft <= 10;
    return (
      <div className="sim-portal" role="group" aria-label="Timed test on the passage you just read">
        <div className="sim-portal-disclaimer">A timed test on what you just read, answer as much as you can before time runs out.</div>
        <div className="sim-readaloud-window">
          <div className={`sim-quiz-timerbar${urgent ? ' is-urgent' : ''}`}>
            <span className={`sim-quiz-timer${urgent ? ' is-urgent' : ''}`}>{formatTime(testSecondsLeft)}</span>
          </div>

          <div className="sim-quiz-list">
            {MC_QUESTIONS.map((q, i) => (
              <QuizQuestion
                key={i}
                index={i}
                question={q.question}
                options={q.options}
                selected={mcAnswers[i]}
                onSelect={(choice) => setMcAnswers((prev) => prev.map((a, idx) => (idx === i ? choice : a)))}
              />
            ))}

            <div className="sim-quiz-question sim-quiz-written">
              <p className="sim-quiz-question-text">
                <span className="sim-quiz-question-number">9.</span> In your own words, briefly explain what caused
                the Great Molasses Flood.
              </p>
              <textarea
                aria-label="Written response 1"
                value={written1}
                onChange={(e) => setWritten1(e.target.value)}
                placeholder="1-2 sentences"
              />
            </div>
            <div className="sim-quiz-question sim-quiz-written">
              <p className="sim-quiz-question-text">
                <span className="sim-quiz-question-number">10.</span> Why did this disaster lead to changes in how
                buildings and tanks were engineered afterward?
              </p>
              <textarea
                aria-label="Written response 2"
                value={written2}
                onChange={(e) => setWritten2(e.target.value)}
                placeholder="1-2 sentences"
              />
            </div>
          </div>

          <p className="sim-portal-hint">You can leave questions blank if you run out of time.</p>
          <div className="btn-row">
            <button type="button" className="btn btn-primary" onClick={handleSubmitTest}>
              Submit Test
            </button>
          </div>
        </div>
      </div>
    );
  }

  // phase === 'gradebook' — a fixed, fake result shown regardless of what
  // was actually answered above; nothing here reflects real scoring.
  return <GradebookBlock title={ESSAY_TITLE} onDone={onComplete} />;
}

// A mandatory 10-second wait sitting with the (fake) result before
// "Continue" becomes clickable — same gating pattern used for the narrative
// slides and other timed steps elsewhere in this app.
function GradebookBlock({ title, onDone }) {
  const secondsLeft = useCountdown(10, 'gradebook');
  const ready = secondsLeft <= 0;
  return (
    <div className="sim-portal" role="group" aria-label="Test results">
      <div className="sim-portal-disclaimer">Simulated gradebook, nothing here reflects your real answers or a real grade.</div>
      <div className="sim-gradebook-window">
        <p className="sim-portal-section-title" style={{ marginBottom: 4 }}>
          {title}, Test Results
        </p>
        <div className="sim-gradebook-score">60%</div>
        <p className="sim-gradebook-note">This score is simulated for the study and is not a real grade.</p>
        <div className="sim-gradebook-row">
          <span>Multiple choice</span>
          <span>5 / 8</span>
        </div>
        <div className="sim-gradebook-row">
          <span>Written response</span>
          <span>1 / 2</span>
        </div>
        <div className="sim-gradebook-row">
          <span>Overall grade</span>
          <span>D</span>
        </div>
        <p className="sim-portal-hint">{ready ? 'You may continue.' : `You can continue in ${secondsLeft}s`}</p>
        <div className="btn-row">
          <button type="button" className="btn btn-primary" disabled={!ready} onClick={onDone}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
