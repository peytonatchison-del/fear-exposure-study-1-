import React, { useEffect, useRef, useState } from 'react';
import useCountdown from '../hooks/useCountdown.js';

// Session 2 (Level 2) for the Applying for a Job category — the participant
// fills out a short, fake résumé: 5 open-ended questions covering a career
// objective, education, skills, experience, and achievements. A visible
// 2-minute-30-second countdown runs the whole time, same timer-bar styling
// as the Test-Taking category's timed quizzes.
//
// Two rules, both explicitly requested, that look contradictory at first but
// aren't: "Continue" only becomes clickable once every question has a real
// answer (same validation gate used everywhere else in this app) — but if
// the clock reaches 0 first, the level auto-advances anyway, answered or
// not, same auto-submit-at-zero pattern as TestAnxietyModerateTestSim. And
// unlike the narrative slides elsewhere in this app, there's no *minimum*
// wait here — finishing early and clicking Continue at 0:40 is fine, the
// full 2:30 is a ceiling, not a floor.
const RESUME_SECONDS = 150; // 2 minutes 30 seconds

const QUESTIONS = [
  {
    key: 'objective',
    label: 'Career Objective',
    prompt: 'What type of job are you applying for, and why are you interested in it?',
  },
  {
    key: 'education',
    label: 'Education',
    prompt: 'What relevant subjects or coursework have you studied?',
  },
  {
    key: 'skills',
    label: 'Skills',
    prompt: 'What are three skills you have that would help you succeed in this job?',
  },
  {
    key: 'experience',
    label: 'Experience',
    prompt: 'Describe a time you took responsibility, helped someone, or worked as part of a team.',
  },
  {
    key: 'achievements',
    label: 'Achievements',
    prompt: 'What is an accomplishment, award, or training experience you are proud of?',
  },
];

function formatTime(totalSeconds) {
  const clamped = Math.max(0, totalSeconds);
  const m = Math.floor(clamped / 60);
  const s = clamped % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function JobApplicationResumeSim({ onComplete }) {
  const secondsLeft = useCountdown(RESUME_SECONDS, 'resume-form');
  const [answers, setAnswers] = useState(() => Object.fromEntries(QUESTIONS.map((q) => [q.key, ''])));
  const doneRef = useRef(false);
  const allAnswered = QUESTIONS.every((q) => answers[q.key].trim().length > 0);
  const urgent = secondsLeft <= 20;

  // Auto-advances the instant the clock hits zero, whatever's filled in so far.
  useEffect(() => {
    if (secondsLeft === 0 && !doneRef.current) {
      doneRef.current = true;
      onComplete();
    }
  }, [secondsLeft, onComplete]);

  function handleSubmit() {
    if (doneRef.current || !allAnswered) return;
    doneRef.current = true;
    onComplete();
  }

  return (
    <div className="sim-portal" role="group" aria-label="Fake résumé application form">
      <div className="sim-portal-disclaimer">
        Fill out a short practice résumé below. You have up to 2 minutes 30 seconds, but you can continue as soon
        as every question is answered, you don&rsquo;t need to wait for the full time.
      </div>

      <div className="sim-readaloud-window">
        <div className={`sim-quiz-timerbar${urgent ? ' is-urgent' : ''}`}>
          <span className={`sim-quiz-timer${urgent ? ' is-urgent' : ''}`}>{formatTime(secondsLeft)}</span>
        </div>

        <div className="critical-banner" style={{ marginTop: 14 }}>
          Please do not include any identifiable information (your real name, school, city, or similar) in your
          answers below — use general or made-up details instead.
        </div>

        <div className="sim-quiz-list">
          {QUESTIONS.map((q) => (
            <div key={q.key} className="sim-quiz-question sim-quiz-written">
              <p className="sim-quiz-question-text">
                <span className="sim-quiz-question-number">{q.label}:</span> {q.prompt}
              </p>
              <textarea
                aria-label={q.label}
                value={answers[q.key]}
                onChange={(e) => setAnswers((a) => ({ ...a, [q.key]: e.target.value }))}
                placeholder="Type your answer here"
              />
            </div>
          ))}
        </div>

        <p className="sim-portal-hint">
          {allAnswered ? 'You may continue.' : 'Answer every question above to continue.'}
        </p>
        <div className="btn-row">
          <button type="button" className="btn btn-primary" disabled={!allAnswered} onClick={handleSubmit}>
            Submit Résumé &amp; Continue
          </button>
        </div>
      </div>
    </div>
  );
}
