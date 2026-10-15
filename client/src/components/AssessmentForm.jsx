import React, { useState } from 'react';
import Slider from './Slider.jsx';
import QuestionnaireTable from './QuestionnaireTable.jsx';
import { getFearTopicPhrase, fillTopicPlaceholder } from '../utils/fearTopics.js';

// Shared standardized-assessment form used for both the baseline (Screen 4)
// and final (Screen 9) assessments — same questions both times, so the
// researcher can compare pre/post. When phase="final", two extra qualitative
// reflection questions are added at the end (gathering qualitative data to
// go alongside the quantitative ratings above).
//
// Every question here is required — every GAD-7 item needs a selected
// answer, and (on the final assessment) both reflection questions need real
// text — before "Continue"/"Finish Study" becomes clickable. The anxiety
// slider at the top doesn't need its own "did they answer it" check: unlike
// a blank textbox or an unselected GAD-7 option, a 1-10 slider always shows
// a real, valid answer, even if the participant never touches it because
// their honest answer already matches the default (5). An earlier version
// required the slider to be physically moved before counting it as
// "answered," which meant a participant whose true answer was 5 could click
// Continue and be wrongly told to "answer the question above" — so that
// extra check was removed.
export default function AssessmentForm({ categoryId, categoryName, questionnaireItems, onSubmit, busy, submitLabel, phase }) {
  const topic = getFearTopicPhrase(categoryId, categoryName);
  const [anxietyNow, setAnxietyNow] = useState(5);
  // There used to be a second, separate "how fearful do you feel about
  // [category]" slider here — it asked essentially the same thing as the
  // anxiety slider above, just in different words. They're now one question;
  // its value is mirrored into both the anxiety_now and fear_rating fields
  // this form submits, so nothing downstream (export, stats) has to change.
  const [answers, setAnswers] = useState(() =>
    Object.fromEntries((questionnaireItems || []).map((q) => [q.id, null]))
  );
  const [helpedMost, setHelpedMost] = useState('');
  const [couldImprove, setCouldImprove] = useState('');
  const [error, setError] = useState('');

  const templatedItems = (questionnaireItems || []).map((q) => ({
    ...q,
    text: fillTopicPlaceholder(q.text, categoryId, categoryName),
  }));

  function handleSubmit() {
    setError('');
    if (questionnaireItems?.length > 0) {
      const unanswered = questionnaireItems.some((q) => answers[q.id] === null || answers[q.id] === undefined);
      if (unanswered) {
        setError('Please answer every question below before continuing.');
        return;
      }
    }
    if (phase === 'final' && (!helpedMost.trim() || !couldImprove.trim())) {
      setError('Please answer both reflection questions below before continuing.');
      return;
    }
    const payload = { anxietyNow, fearRating: anxietyNow, questionnaire: answers };
    if (phase === 'final') {
      payload.helpedMost = helpedMost.trim();
      payload.couldImprove = couldImprove.trim();
    }
    onSubmit(payload).catch((err) => setError(err.message));
  }

  return (
    <div>
      <Slider
        question={`How anxious do you feel right now about ${topic}?`}
        value={anxietyNow}
        onChange={setAnxietyNow}
        minLabel="Not anxious"
        maxLabel="Extremely anxious"
      />

      {questionnaireItems?.length > 0 && (
        <>
          <h2 className="section-title">Check-In</h2>
          <p className="lead">Over the last 2 weeks, how often have you been bothered by the following problems?</p>
          <QuestionnaireTable
            items={templatedItems}
            answers={answers}
            onChange={(id, value) => setAnswers((a) => ({ ...a, [id]: value }))}
          />
        </>
      )}

      {phase === 'final' && (
        <>
          <h2 className="section-title">Reflecting on the study</h2>
          <div className="field-block">
            <label className="field-label" htmlFor="helped-most">
              Looking back across your sessions, what helped the most, if anything?
            </label>
            <textarea id="helped-most" value={helpedMost} onChange={(e) => setHelpedMost(e.target.value)} />
          </div>
          <div className="field-block">
            <label className="field-label" htmlFor="could-improve">
              What could have been better, or what would you change about this study?
            </label>
            <textarea id="could-improve" value={couldImprove} onChange={(e) => setCouldImprove(e.target.value)} />
          </div>
        </>
      )}

      {error && <p className="error-text">{error}</p>}

      <div className="btn-row">
        <button className="btn btn-primary" disabled={busy} onClick={handleSubmit}>
          {submitLabel || 'Continue'}
        </button>
      </div>
    </div>
  );
}
