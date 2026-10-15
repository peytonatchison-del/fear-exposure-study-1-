import React, { useEffect, useState } from 'react';
import useCountdown from '../hooks/useCountdown.js';

// College Admissions Session 3 — a fake admissions-office email that opens
// into an envelope, which opens to reveal a rejection letter. Unlike every
// other stimulus in this app, the letter itself is never generated here: a
// researcher uploads their own image of the actual letter from the Stimuli
// tab (see rejectionLetterUrl below), and this component only supplies the
// surrounding email/envelope interaction and animation. If no letter has
// been uploaded yet, a plain placeholder is shown instead of any invented
// text.
//
// Phases: email (10s wait, then click the message) -> envelope (10s wait,
// then click the envelope) -> opening (brief animation, no interaction) ->
// letter (the reveal, with a final 10s wait before Continue).
export default function CollegeAdmissionsRejectionEmailSim({ stimulus, onComplete }) {
  const [phase, setPhase] = useState('email'); // email | envelope | opening | letter
  // Restarts to 10 every time `phase` changes, so each of the email,
  // envelope, and letter phases gets its own fresh 10-second wait — the
  // brief 'opening' phase doesn't use this value, it just resets it.
  const secondsLeft = useCountdown(10, phase);
  const ready = secondsLeft <= 0;
  const rejectionLetterUrl = stimulus?.rejectionLetterUrl || null;

  // The envelope-opening animation is purely visual — after it plays for a
  // beat, move on to the full letter reveal automatically.
  useEffect(() => {
    if (phase !== 'opening') return undefined;
    const timer = setTimeout(() => setPhase('letter'), 800);
    return () => clearTimeout(timer);
  }, [phase]);

  function handleOpenEmail() {
    if (!ready) return;
    setPhase('envelope');
  }

  function handleOpenEnvelope() {
    if (!ready) return;
    setPhase('opening');
  }

  if (phase === 'email') {
    return (
      <div className="sim-portal" role="group" aria-label="Simulated admissions-office email">
        <div className="sim-portal-disclaimer">Simulated scenario for this study, not a real email</div>
        <div className="sim-portal-window">
          <div className="sim-portal-topbar">
            <div className="sim-portal-brand">
              <span className="sim-portal-brand-mark" aria-hidden="true">UF</span>
              <div>
                <div className="sim-portal-brand-name">University of Florida</div>
                <div className="sim-portal-brand-sub">Office of Admissions</div>
              </div>
            </div>
            <div className="sim-portal-user">Inbox</div>
          </div>
          <div className="sim-portal-body">
            <h3 className="sim-portal-section-title">Inbox</h3>
            <button
              type="button"
              className={`sim-portal-message-row${ready ? '' : ' is-locked'}`}
              disabled={!ready}
              onClick={handleOpenEmail}
            >
              <span className="sim-portal-unread-dot" aria-hidden="true" />
              <span className="sim-portal-message-summary">
                <span className="sim-portal-message-subject">Your Admission Decision Is Ready</span>
                <span className="sim-portal-message-preview">
                  Office of Admissions, your application status has been updated&hellip;
                </span>
              </span>
              <span className="sim-portal-new-badge">NEW</span>
            </button>
            <p className="sim-portal-hint">{ready ? 'You may click the message to open it.' : `You can open this in ${secondsLeft}s`}</p>
          </div>
        </div>
      </div>
    );
  }

  // envelope | opening — same visual, just with (or without) the
  // is-opening class driving the reveal animation.
  if (phase === 'envelope' || phase === 'opening') {
    const opening = phase === 'opening';
    return (
      <div className="sim-portal" role="group" aria-label="Simulated envelope containing your admission decision">
        <div className="sim-portal-disclaimer">Simulated scenario for this study, not a real letter</div>
        <div className="sim-envelope-stage">
          <button
            type="button"
            className={`sim-envelope-wrap${!opening && !ready ? ' is-locked' : ''}${opening ? ' is-opening' : ''}`}
            disabled={opening || !ready}
            onClick={handleOpenEnvelope}
            aria-label="Open the envelope"
            style={{ border: 'none', background: 'none', padding: 0 }}
          >
            <div className="sim-letter-peek" aria-hidden="true" />
            <div className="sim-envelope-body">
              <div className="sim-envelope-flap" aria-hidden="true" />
              <span className="sim-envelope-seal" aria-hidden="true" />
            </div>
          </button>
          {!opening && (
            <p className="sim-portal-hint">{ready ? 'You may click the envelope to open it.' : `You can open this in ${secondsLeft}s`}</p>
          )}
        </div>
      </div>
    );
  }

  // phase === 'letter'
  return (
    <div className="sim-portal" role="group" aria-label="Your admission decision letter">
      <div className="sim-portal-disclaimer">Simulated scenario for this study</div>
      <div className="sim-letter-card">
        {rejectionLetterUrl ? (
          <img className="sim-letter-image" src={rejectionLetterUrl} alt="Admission decision letter" />
        ) : (
          <p className="sim-letter-placeholder">
            [No rejection letter has been uploaded for this stimulus yet, a researcher needs to add one from the
            Stimuli tab in the Researcher Portal.]
          </p>
        )}
      </div>
      <p className="sim-portal-hint">{ready ? 'You may continue.' : `You can continue in ${secondsLeft}s`}</p>
      <div className="btn-row">
        <button type="button" className="btn btn-primary" disabled={!ready} onClick={onComplete}>
          Continue
        </button>
      </div>
    </div>
  );
}
