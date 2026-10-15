import React from 'react';

const TICKS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// A 1-10 rating scale. Deliberately not a raw 0-100 range input — a 10-point
// scale with numbered stops is faster for a participant to answer
// consistently and reads much more like a normal "rate 1-10" question.
export default function Slider({ question, value, onChange, minLabel = 'Not at all', maxLabel = 'Extremely' }) {
  const fillPercent = ((value - 1) / 9) * 100;

  return (
    <div className="slider-block">
      <div className="slider-block__header">
        <label className="slider-block__question" htmlFor={undefined}>
          {question}
        </label>
        <span className="slider-block__value-badge">{value}</span>
      </div>

      <input
        type="range"
        min={1}
        max={10}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="slider-block__input"
        style={{ '--fill-percent': `${fillPercent}%` }}
        aria-label={question}
        aria-valuemin={1}
        aria-valuemax={10}
        aria-valuenow={value}
      />

      <div className="slider-block__ticks" aria-hidden="true">
        {TICKS.map((n) => (
          <span key={n} className={`slider-block__tick ${n === value ? 'is-active' : ''}`}>
            {n}
          </span>
        ))}
      </div>

      <div className="slider-endpoints">
        <span>1 = {minLabel}</span>
        <span>10 = {maxLabel}</span>
      </div>
    </div>
  );
}
