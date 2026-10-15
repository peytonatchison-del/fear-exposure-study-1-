import React, { useEffect, useRef, useState } from 'react';
import QuizQuestion from './QuizQuestion.jsx';

// Session 3 (Level 3) for the Test-Taking category — a 10-question
// multiple-choice test, harder than Session 2 but still material a typical
// 10th grader has encountered, under real time pressure: 1 minute total,
// with the countdown always visible and a "+10 seconds" button if the
// participant needs more time. Every question has to be answered before
// "Submit Test" becomes clickable — BUT if the clock runs out first, it
// submits automatically regardless of how many questions were answered, no
// completion required. That's the whole point of the timer: it overrides
// the "answer everything" rule the moment it hits zero.
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

const QUESTIONS = [
  { question: 'What is the value of x in 2x + 4 = 12?', options: ['2', '4', '6', '8'] },
  { question: 'Which organelle is known as the "powerhouse of the cell"?', options: ['Nucleus', 'Ribosome', 'Mitochondria', 'Golgi apparatus'] },
  { question: 'Who wrote the play "Romeo and Juliet"?', options: ['Charles Dickens', 'William Shakespeare', 'Mark Twain', 'Jane Austen'] },
  { question: 'In what year did World War II end?', options: ['1939', '1942', '1945', '1950'] },
  { question: 'What is the chemical symbol for sodium?', options: ['So', 'Sd', 'Na', 'S'] },
  { question: 'Which branch of the U.S. government is responsible for making laws?', options: ['Executive', 'Legislative', 'Judicial', 'Administrative'] },
  { question: 'What is the area of a rectangle with a length of 8 and a width of 5?', options: ['13', '26', '40', '45'] },
  { question: 'A renewed interest in which texts is most associated with the Renaissance?', options: ['Ancient Greek and Roman texts', 'Medieval folklore', 'Industrial manuals', 'Modern science journals'] },
  { question: 'What part of speech is the word "quickly" in the sentence "She ran quickly"?', options: ['Noun', 'Verb', 'Adjective', 'Adverb'] },
  { question: 'Which of these numbers is a prime number?', options: ['21', '27', '29', '33'] },
];

export default function TestAnxietyModerateTestSim({ onComplete }) {
  const [secondsLeft, setSecondsLeft] = useState(60); // 1 minute
  const [answers, setAnswers] = useState(() => new Array(QUESTIONS.length).fill(null));
  const onCompleteRef = useLatest(onComplete);
  const doneRef = useRef(false);
  const allAnswered = answers.every((a) => a !== null);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-submits the moment the clock hits zero, whatever's answered so far.
  useEffect(() => {
    if (secondsLeft === 0 && !doneRef.current) {
      doneRef.current = true;
      onCompleteRef.current();
    }
  }, [secondsLeft, onCompleteRef]);

  function handleSubmit() {
    if (doneRef.current || !allAnswered) return;
    doneRef.current = true;
    onComplete();
  }

  const urgent = secondsLeft <= 10;

  return (
    <div className="sim-portal" role="group" aria-label="Timed multiple-choice test">
      <div className="sim-portal-disclaimer">A timed test, answer as many questions as you can before time runs out.</div>

      <div className="sim-readaloud-window">
        <div className={`sim-quiz-timerbar${urgent ? ' is-urgent' : ''}`}>
          <span className={`sim-quiz-timer${urgent ? ' is-urgent' : ''}`}>{formatTime(secondsLeft)}</span>
          <button type="button" className="btn btn-secondary sim-quiz-extend" onClick={() => setSecondsLeft((s) => s + 10)}>
            +10 seconds
          </button>
        </div>

        <div className="sim-quiz-list">
          {QUESTIONS.map((q, i) => (
            <QuizQuestion
              key={i}
              index={i}
              question={q.question}
              options={q.options}
              selected={answers[i]}
              onSelect={(choice) => setAnswers((prev) => prev.map((a, idx) => (idx === i ? choice : a)))}
            />
          ))}
        </div>

        <p className="sim-portal-hint">
          {allAnswered ? 'You may submit.' : 'Answer all questions to submit, or just run out the clock.'}
        </p>
        <div className="btn-row">
          <button type="button" className="btn btn-primary" disabled={!allAnswered} onClick={handleSubmit}>
            Submit Test
          </button>
        </div>
      </div>
    </div>
  );
}
