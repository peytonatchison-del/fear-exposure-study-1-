import React, { useState } from 'react';
import QuizQuestion from './QuizQuestion.jsx';

// Session 2 (Level 2) for the Test-Taking category — a short, deliberately
// easy 5-question multiple-choice quiz with NO timer, meant to be low-
// pressure: general-knowledge questions almost everyone already knows the
// answer to, so the exposure here is just "taking a test," not "struggling
// with one."
const QUESTIONS = [
  { question: 'What color do you get when you mix blue and yellow?', options: ['Purple', 'Green', 'Orange', 'Pink'] },
  { question: 'How many days are there in a week?', options: ['5', '6', '7', '8'] },
  { question: 'What is the capital of the United States?', options: ['New York City', 'Washington, D.C.', 'Los Angeles', 'Chicago'] },
  { question: 'Which planet do we live on?', options: ['Mars', 'Venus', 'Earth', 'Jupiter'] },
  { question: 'What is 2 + 2?', options: ['3', '4', '5', '22'] },
];

export default function TestAnxietyEasyTestSim({ onComplete }) {
  const [answers, setAnswers] = useState(() => new Array(QUESTIONS.length).fill(null));
  const allAnswered = answers.every((a) => a !== null);

  return (
    <div className="sim-portal" role="group" aria-label="Short, low-pressure multiple-choice quiz">
      <div className="sim-portal-disclaimer">A short quiz, take your time, there&rsquo;s no timer.</div>

      <div className="sim-readaloud-window">
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
        <p className="sim-portal-hint">{allAnswered ? 'You may continue.' : 'Answer all questions to continue.'}</p>
        <div className="btn-row">
          <button type="button" className="btn btn-primary" disabled={!allAnswered} onClick={onComplete}>
            Submit &amp; Continue
          </button>
        </div>
      </div>
    </div>
  );
}
