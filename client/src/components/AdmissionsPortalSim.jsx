import React, { useState } from 'react';
import useCountdown from '../hooks/useCountdown.js';

// A small, self-contained interactive mockup used as an exposure stimulus
// for fear/anxiety related to checking a college admission decision online.
// It is a fictional scenario embedded inside the study app — it never
// contacts any real institution and it deliberately never reveals an
// admission decision. It only simulates the moments of noticing a
// notification and opening it, then hands control back to the study
// (the "questions" phase) the instant the participant would otherwise see
// a result.
//
// `onComplete` is called once, when the participant clicks through to the
// point where a decision would normally appear. The parent screen is
// responsible for deciding what happens next (in this app, that's moving on
// to the post-exposure rating questions).
export default function AdmissionsPortalSim({ onComplete }) {
  const [step, setStep] = useState('inbox'); // inbox | message
  // Builds a beat of suspense before the participant can click through to
  // the (never-revealed) decision — resets each time `step` changes.
  const secondsLeft = useCountdown(10, step);
  const ready = secondsLeft <= 0;

  return (
    <div className="sim-portal" role="group" aria-label="Simulated college applicant portal">
      <div className="sim-portal-disclaimer">Simulated scenario for this study, not a real website</div>

      <div className="sim-portal-window">
        <div className="sim-portal-topbar">
          <div className="sim-portal-brand">
            <span className="sim-portal-brand-mark" aria-hidden="true">UF</span>
            <div>
              <div className="sim-portal-brand-name">University of Florida</div>
              <div className="sim-portal-brand-sub">Office of Admissions &middot; Applicant Portal</div>
            </div>
          </div>
          <div className="sim-portal-user">Applicant Dashboard</div>
        </div>

        {step === 'inbox' && (
          <div className="sim-portal-body">
            <h3 className="sim-portal-section-title">Inbox</h3>
            <button type="button" className="sim-portal-message-row" onClick={() => setStep('message')}>
              <span className="sim-portal-unread-dot" aria-hidden="true" />
              <span className="sim-portal-message-summary">
                <span className="sim-portal-message-subject">You have a new message</span>
                <span className="sim-portal-message-preview">
                  Office of Admissions, your application status has been updated&hellip;
                </span>
              </span>
              <span className="sim-portal-new-badge">NEW</span>
            </button>
            <p className="sim-portal-hint">Click the message to open it.</p>
          </div>
        )}

        {step === 'message' && (
          <div className="sim-portal-body">
            <button type="button" className="sim-portal-back" onClick={() => setStep('inbox')}>
              &larr; Back to Inbox
            </button>
            <h3 className="sim-portal-section-title">Your Admission Decision Is Ready</h3>
            <p className="sim-portal-message-meta">From: Office of Admissions &middot; University of Florida</p>
            <p className="sim-portal-message-body">
              Your application has been reviewed and a decision has been made. Click below to view your admission
              status in the Applicant Status Portal.
            </p>
            <p className="sim-portal-hint">{ready ? 'You may continue.' : `You can view your decision in ${secondsLeft}s`}</p>
            <button
              type="button"
              className="btn btn-primary sim-portal-decision-btn"
              disabled={!ready}
              onClick={onComplete}
            >
              View My Decision
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
