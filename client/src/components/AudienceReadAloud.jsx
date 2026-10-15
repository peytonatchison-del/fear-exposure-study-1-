import React, { useEffect, useState } from 'react';

// Public Speaking Session 2 — a simulated classroom audience (or, if the
// researcher has uploaded one, their own classroom/audience video) and a
// preset passage the participant reads aloud. The countdown timer gates
// Continue: it's disabled until the timer reaches 0, so the timed portion of
// the exposure can't be skipped. The "+10 seconds" button lets the
// participant add time if they need it, and never makes the timer run out
// early — it only ever gives more time, on top of the normal countdown.
function formatTime(totalSeconds) {
  const clamped = Math.max(0, totalSeconds);
  const m = Math.floor(clamped / 60);
  const s = clamped % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function IllustratedAudience({ count }) {
  const seats = Array.from({ length: count });
  return (
    <div className="sim-audience sim-audience--small" aria-hidden="true">
      {seats.map((_, i) => (
        <div key={i} className="sim-audience-person">
          <div className="sim-audience-head" />
          <div className="sim-audience-body" />
        </div>
      ))}
    </div>
  );
}

export default function AudienceReadAloud({
  audienceCount,
  audienceVideoUrl,
  audienceVideoCredit,
  passageTitle,
  passageText,
  initialSeconds,
  onComplete,
}) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const ready = secondsLeft <= 0;

  return (
    <div className="sim-portal" role="group" aria-label="Simulated classroom audience">
      <div className="sim-portal-disclaimer">
        {audienceVideoUrl ? 'Read the passage below out loud to the class in the video' : 'Simulated classroom, read the passage below out loud'}
      </div>

      {audienceVideoUrl ? (
        <>
          <div className="sim-video-overlay-frame">
            <video className="sim-audience-video--overlay" src={audienceVideoUrl} autoPlay loop muted playsInline />
            {/* Pinned to the TOP and clamped to a few lines (with its own
                scrollbar for the rest) — a bottom bar was covering people's
                faces in the video. */}
            <div className="sim-video-caption-bar sim-video-caption-bar--top">
              {passageTitle && <p className="sim-video-caption-title">{passageTitle}</p>}
              <p className="sim-video-caption-text">{passageText}</p>
            </div>
          </div>
          {/* Sits BELOW the video frame now, in normal document flow — it
              used to overlay the caption box itself, which ended up
              covering part of the script text it was pointing at. */}
          <p className="sim-video-scroll-hint">&#9662; The passage box above scrolls, there&rsquo;s more to read inside it.</p>
          {audienceVideoCredit && <p className="sim-video-credit-footer">{audienceVideoCredit}</p>}
        </>
      ) : (
        <IllustratedAudience count={audienceCount} />
      )}

      <div className="sim-readaloud-window">
        <div className="sim-readaloud-timerbar">
          <span className="sim-readaloud-timer">{formatTime(secondsLeft)}</span>
          <button type="button" className="btn btn-secondary sim-readaloud-extend" onClick={() => setSecondsLeft((s) => s + 10)}>
            +10 seconds
          </button>
        </div>

        {!audienceVideoUrl && (
          <>
            {passageTitle && <h3 className="sim-portal-section-title">{passageTitle}</h3>}
            <p className="sim-readaloud-passage">{passageText}</p>
          </>
        )}

        <p className="sim-portal-hint">
          {ready ? 'You may continue.' : `You can continue in ${formatTime(secondsLeft)}`}
        </p>
        <div className="btn-row">
          <button type="button" className="btn btn-primary" disabled={!ready} onClick={onComplete}>
            I&rsquo;ve Finished Reading, Continue
          </button>
        </div>
      </div>
    </div>
  );
}
