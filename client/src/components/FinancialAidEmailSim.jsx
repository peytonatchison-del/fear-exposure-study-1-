import React, { useState } from 'react';
import useCountdown from '../hooks/useCountdown.js';

// A fictional financial-aid email + tuition-balance page, used as the
// highest-intensity exposure stimulus for college-cost anxiety. Like
// AdmissionsPortalSim, this never collects any real information and never
// includes an actual payment form — it only displays a made-up balance for
// the participant to look at. Moving from the email to the account page has
// a 10-second suspense gate (same as the other simulations); once on the
// balance page, a longer 15-second timer must run out before Continue is
// clickable, so the participant has to actually sit with the numbers rather
// than just clicking past them.
export default function FinancialAidEmailSim({ onComplete }) {
  const [step, setStep] = useState('inbox'); // inbox | email | balance
  const secondsLeft = useCountdown(step === 'balance' ? 15 : 10, step);
  const ready = secondsLeft <= 0;

  return (
    <div className="sim-portal" role="group" aria-label="Simulated financial aid portal">
      <div className="sim-portal-disclaimer">Simulated scenario for this study, not a real website</div>

      <div className="sim-portal-window">
        <div className="sim-portal-topbar">
          <div className="sim-portal-brand">
            <span className="sim-portal-brand-mark" aria-hidden="true">UF</span>
            <div>
              <div className="sim-portal-brand-name">University of Florida</div>
              <div className="sim-portal-brand-sub">Office of Student Financial Services</div>
            </div>
          </div>
          <div className="sim-portal-user">Student Account</div>
        </div>

        {step === 'inbox' && (
          <div className="sim-portal-body">
            <h3 className="sim-portal-section-title">Inbox</h3>
            <button type="button" className="sim-portal-message-row" onClick={() => setStep('email')}>
              <span className="sim-portal-unread-dot" aria-hidden="true" />
              <span className="sim-portal-message-summary">
                <span className="sim-portal-message-subject">Financial Aid &amp; Tuition Update</span>
                <span className="sim-portal-message-preview">
                  Office of Student Financial Services, your enrollment and balance details are ready&hellip;
                </span>
              </span>
              <span className="sim-portal-new-badge">NEW</span>
            </button>
            <p className="sim-portal-hint">Click the message to open it.</p>
          </div>
        )}

        {step === 'email' && (
          <div className="sim-portal-body">
            <button type="button" className="sim-portal-back" onClick={() => setStep('inbox')}>
              &larr; Back to Inbox
            </button>
            <h3 className="sim-portal-section-title">Financial Aid &amp; Tuition Update</h3>
            <p className="sim-portal-message-meta">From: Office of Student Financial Services &middot; University of Florida</p>
            <p className="sim-portal-message-body">
              Hello, this email is to confirm your placement in the Fall 2026 Business Administration program at the
              University of Florida. Your financial aid award has been finalized for the upcoming term. Please review
              your remaining balance and payment timeline by viewing your account below.
            </p>
            <p className="sim-portal-hint">{ready ? 'You may continue.' : `You can view your account in ${secondsLeft}s`}</p>
            <button
              type="button"
              className="btn btn-primary sim-portal-decision-btn"
              disabled={!ready}
              onClick={() => setStep('balance')}
            >
              View My Account
            </button>
          </div>
        )}

        {step === 'balance' && (
          <div className="sim-portal-body">
            <h3 className="sim-portal-section-title">Account Summary &mdash; Fall 2026</h3>
            <div className="sim-balance-table">
              <div className="sim-balance-row">
                <span>Total Tuition &amp; Fees</span>
                <span>$21,400</span>
              </div>
              <div className="sim-balance-row">
                <span>Financial Aid Applied</span>
                <span>&minus;$3,200</span>
              </div>
              <div className="sim-balance-row sim-balance-row--total">
                <span>Remaining Balance Due</span>
                <span>$18,200</span>
              </div>
              <div className="sim-balance-row">
                <span>Payment Due Date</span>
                <span>August 15, 2026</span>
              </div>
            </div>
            <p className="sim-portal-hint" style={{ marginTop: 14 }}>
              {secondsLeft > 0 ? `You can continue in ${secondsLeft}s` : 'You may continue'}
            </p>
            <button
              type="button"
              className="btn btn-primary sim-portal-decision-btn"
              disabled={secondsLeft > 0}
              onClick={onComplete}
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
