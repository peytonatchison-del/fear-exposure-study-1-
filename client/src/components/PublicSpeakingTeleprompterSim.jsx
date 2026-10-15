import React, { useEffect, useState } from 'react';

// Session 3 (Level 3) for the Public Speaking category — the exposure level
// increases in two ways at once: a noticeably larger simulated audience, and
// a longer script with somewhat more complex vocabulary/sentence structure
// than Session 2.
//
// The script is shown one sentence at a time, and the participant controls
// the pace themselves by pressing the spacebar (or tapping/clicking) to
// advance. Alongside that, there's a 1-minute-25-second minimum-exposure
// timer that stays visible the whole time — reaching the last sentence
// doesn't finish the exposure early; the timer has to run out too. Unlike
// Session 2, there's no "+10 seconds" button here — the timer is fixed. A
// short instructions screen explains both before the simulation actually
// starts.
const SENTENCES = [
  'Good afternoon.',
  'I’d like to talk with you today about why learning new skills, even ones that feel unfamiliar or uncomfortable at first, is one of the most valuable things a person can do.',
  'When we first attempt something new, whether it’s a sport, an instrument, or a difficult subject in school, we tend to focus on how awkward or unpolished our early attempts feel.',
  'It’s tempting to conclude that we simply aren’t suited for it.',
  'However, that early discomfort is not actually a sign of failure, it’s a normal and necessary part of building any new ability.',
  'Consider how differently we treat physical skills: nobody expects to run a marathon the first time they put on running shoes.',
  'We understand, almost instinctively, that endurance is built gradually, through repeated effort over time.',
  'Strangely, we rarely extend that same patience to ourselves when the skill in question is mental, social, or creative rather than physical.',
  'Public speaking is a perfect example.',
  'The first time someone stands in front of a group, it can feel disproportionately intense compared to almost anything else they do that day.',
  'But with repeated, manageable practice, that same activity gradually becomes far more ordinary.',
  'The goal isn’t to eliminate every trace of nervousness, it’s to prove to ourselves, through direct experience, that we can handle it anyway.',
  'Thank you.',
];

const AUDIENCE_COUNT = 18;

function formatTime(totalSeconds) {
  const clamped = Math.max(0, totalSeconds);
  const m = Math.floor(clamped / 60);
  const s = clamped % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function PublicSpeakingTeleprompterSim({ stimulus, onComplete }) {
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(85); // 1 minute 25 seconds
  const audienceVideoUrl = stimulus?.audienceVideoUrl || null;
  const audienceVideoCredit = stimulus?.audienceVideoCredit || null;
  const isLast = index === SENTENCES.length - 1;
  const ready = secondsLeft <= 0;

  useEffect(() => {
    if (!started) return undefined;
    const interval = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [started]);

  // Advances to the next sentence. On the last sentence, it only finishes
  // the exposure once the 1-minute-25-second timer has also run out —
  // otherwise nothing happens (the on-screen hint explains why). Shared by
  // the spacebar handler below and by the tap/click handler on the
  // teleprompter area itself, so it works the same way on a phone (no
  // physical keyboard) as it does on a laptop.
  function handleAdvance() {
    setIndex((i) => {
      if (i >= SENTENCES.length - 1) {
        if (ready) onComplete();
        return i;
      }
      return i + 1;
    });
  }

  // Spacebar advances to the next sentence (desktop/laptop with a keyboard).
  useEffect(() => {
    if (!started) return undefined;
    function handleKeyDown(e) {
      if (e.code !== 'Space' && e.key !== ' ') return;
      e.preventDefault();
      handleAdvance();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, onComplete, ready]);

  if (!started) {
    return (
      <div className="sim-portal" role="group" aria-label="Simulated large classroom audience with teleprompter">
        <div className="sim-readaloud-window">
          <h3 className="sim-portal-section-title">Before You Start</h3>
          <p className="sim-portal-message-body">
            You&rsquo;ll read a script aloud to the class in the video. It&rsquo;s shown one sentence at a time,
            press the <strong>spacebar</strong>, or <strong>tap or click anywhere on the screen</strong>, whenever
            you&rsquo;re ready to move to the next sentence, at your own pace. There&rsquo;s also a 1-minute-25-second
            timer that stays on screen the whole time, and the exposure won&rsquo;t finish until the timer runs out,
            even if you reach the last sentence first.
          </p>
          <div className="btn-row">
            <button type="button" className="btn btn-primary" onClick={() => setStarted(true)}>
              Start
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sim-portal" role="group" aria-label="Simulated large classroom audience with teleprompter">
      <div className="sim-portal-disclaimer">
        {audienceVideoUrl
          ? 'Read the sentence below out loud, then press the spacebar, tap, or click for the next one'
          : 'Simulated classroom, read each sentence aloud, then press the spacebar, tap, or click to continue'}
      </div>

      <div className="sim-readaloud-window" style={{ marginBottom: 14 }}>
        <div className="sim-readaloud-timerbar" style={{ marginBottom: 0 }}>
          <span className="sim-readaloud-timer">{formatTime(secondsLeft)}</span>
        </div>
      </div>

      {/* Tapping/clicking anywhere in this area advances to the next sentence,
          same as pressing the spacebar — this is what makes the simulation
          usable on a phone or tablet, which has no physical spacebar. */}
      {audienceVideoUrl ? (
        <>
          <div
            className="sim-video-overlay-frame sim-video-overlay-frame--tall"
            onClick={handleAdvance}
            style={{ cursor: 'pointer', touchAction: 'manipulation' }}
          >
            <video className="sim-audience-video--overlay" src={audienceVideoUrl} autoPlay loop muted playsInline />
            <div className="sim-video-caption-bar">
              <p className="sim-video-caption-text">{SENTENCES[index]}</p>
            </div>
          </div>
          {audienceVideoCredit && <p className="sim-video-credit-footer">{audienceVideoCredit}</p>}
        </>
      ) : (
        <>
          <div className="sim-audience sim-audience--large" aria-hidden="true">
            {Array.from({ length: AUDIENCE_COUNT }).map((_, i) => (
              <div key={i} className="sim-audience-person">
                <div className="sim-audience-head" />
                <div className="sim-audience-body" />
              </div>
            ))}
          </div>
          <div
            className="sim-readaloud-window"
            onClick={handleAdvance}
            style={{ cursor: 'pointer', touchAction: 'manipulation' }}
          >
            <h3 className="sim-portal-section-title">Read This Sentence Aloud</h3>
            <p className="sim-teleprompter-sentence">{SENTENCES[index]}</p>
          </div>
        </>
      )}

      <p className="sim-portal-hint" style={{ textAlign: 'center', marginTop: 12 }}>
        {isLast
          ? ready
            ? 'Press the spacebar, tap, or click to finish.'
            : `You can finish in ${formatTime(secondsLeft)}`
          : `Sentence ${index + 1} of ${SENTENCES.length}, press the spacebar, tap, or click for the next sentence.`}
      </p>
      {isLast && (
        <div className="btn-row">
          <button
            type="button"
            className="btn btn-primary"
            disabled={!ready}
            onClick={(e) => {
              e.stopPropagation();
              onComplete();
            }}
          >
            Finish
          </button>
        </div>
      )}
    </div>
  );
}
