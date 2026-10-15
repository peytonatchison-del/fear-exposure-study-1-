import React from 'react';

// A single multiple-choice question with selectable options — shared by the
// Test-Taking category's quiz simulations (easy/moderate/difficult).
export default function QuizQuestion({ index, question, options, selected, onSelect, disabled }) {
  return (
    <div className="sim-quiz-question">
      <p className="sim-quiz-question-text">
        <span className="sim-quiz-question-number">{index + 1}.</span> {question}
      </p>
      <div className="sim-quiz-options">
        {options.map((opt, i) => (
          <button
            key={i}
            type="button"
            className={`sim-quiz-option${selected === i ? ' is-selected' : ''}`}
            onClick={() => onSelect(i)}
            disabled={disabled}
          >
            <span className="sim-quiz-option-dot" aria-hidden="true" />
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
