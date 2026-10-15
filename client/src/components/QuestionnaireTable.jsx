import React from 'react';

const OPTIONS = [
  { value: 0, label: 'Not at all' },
  { value: 1, label: 'Several days' },
  { value: 2, label: 'More than half the days' },
  { value: 3, label: 'Nearly every day' },
];

// Traditional clinical-style questionnaire table (rows = questions, columns
// = the standard GAD-7 frequency options, click a cell to select it) —
// replaces the old continuous 0-100 slider approach for the standardized
// questionnaire specifically. The anxiety/fear sliders elsewhere in
// AssessmentForm are unaffected; this component only renders whatever
// questionnaire items the researcher has configured (GAD-7 by default).
export default function QuestionnaireTable({ items, answers, onChange }) {
  return (
    <div className="qtable-wrap">
      <table className="qtable">
        <thead>
          <tr>
            <th className="qtable-qcol"></th>
            {OPTIONS.map((opt) => (
              <th key={opt.value} className="qtable-opt-head">
                {opt.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((q) => (
            <tr key={q.id}>
              <td className="qtable-qtext">{q.text}</td>
              {OPTIONS.map((opt) => (
                <td key={opt.value} className="qtable-cell">
                  <button
                    type="button"
                    className={`qtable-radio ${answers[q.id] === opt.value ? 'is-selected' : ''}`}
                    aria-pressed={answers[q.id] === opt.value}
                    aria-label={`${q.text}: ${opt.label}`}
                    onClick={() => onChange(q.id, opt.value)}
                  >
                    <span className="qtable-radio-dot" aria-hidden="true" />
                  </button>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
