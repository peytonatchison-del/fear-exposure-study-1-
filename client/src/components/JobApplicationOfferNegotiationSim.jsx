import React, { useState } from 'react';
import useCountdown from '../hooks/useCountdown.js';

// Session 3 (Level 3) for the Applying for a Job category — a 4-phase
// simulation: an inbox with one unread message (same email/inbox styling as
// CollegeAdmissionsRejectionEmailSim.jsx) that opens into an offer email
// (interview details + a starting salary of $80,000), then a compose screen
// where the participant drafts their own reply asking for $90,000, then the
// employer's response meeting in the middle at $85,000.
//
// Phases: inbox (10s wait, then click the message) -> offer (read the offer,
// 10s wait, then continue to drafting a reply) -> draft (the participant
// writes their own counter-offer email, no fixed wait — "Send" just needs
// real text in the box) -> response (the employer's reply, a final 10s wait
// before Continue).
const COMPANY_NAME = 'Horizon Retail Group';
const SUBJECT = 'Your Application — Interview Invitation & Offer Details';

export default function JobApplicationOfferNegotiationSim({ onComplete }) {
  const [phase, setPhase] = useState('inbox'); // inbox | offer | draft | response
  const [replyText, setReplyText] = useState('');

  // Restarts to 10 every time `phase` changes, so inbox/offer/response each
  // get their own fresh 10-second wait. The draft phase doesn't use this.
  const secondsLeft = useCountdown(10, phase);
  const ready = secondsLeft <= 0;

  function handleOpenEmail() {
    if (!ready) return;
    setPhase('offer');
  }

  function handleContinueToDraft() {
    if (!ready) return;
    setPhase('draft');
  }

  function handleSendReply() {
    if (!replyText.trim()) return;
    setPhase('response');
  }

  if (phase === 'inbox') {
    return (
      <div className="sim-portal" role="group" aria-label="Simulated company email inbox">
        <div className="sim-portal-disclaimer">Simulated scenario for this study, not a real email</div>
        <div className="sim-portal-window">
          <div className="sim-portal-topbar">
            <div className="sim-portal-brand">
              <span className="sim-portal-brand-mark" aria-hidden="true">HR</span>
              <div>
                <div className="sim-portal-brand-name">{COMPANY_NAME}</div>
                <div className="sim-portal-brand-sub">Hiring Team</div>
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
                <span className="sim-portal-message-subject">{SUBJECT}</span>
                <span className="sim-portal-message-preview">
                  Thank you for applying, we&rsquo;d like to invite you to interview&hellip;
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

  if (phase === 'offer') {
    return (
      <div className="sim-portal" role="group" aria-label="Simulated job offer email">
        <div className="sim-portal-disclaimer">Simulated scenario for this study, not a real offer</div>
        <div className="sim-readaloud-window">
          <p className="sim-portal-message-subject" style={{ display: 'block', marginBottom: 4 }}>{SUBJECT}</p>
          <p className="sim-portal-hint" style={{ textAlign: 'left', marginBottom: 14 }}>
            From: Hiring Team &lt;hiring@horizonretailgroup.example&gt;
          </p>
          <p className="sim-portal-message-body">Dear Applicant,</p>
          <p className="sim-portal-message-body">
            Thank you for taking the time to apply for the Associate position with us. We were impressed by your
            application and would like to invite you in to meet the team.
          </p>
          <p className="sim-portal-message-body">
            We&rsquo;re pleased to let you know that, pending a successful interview, we are prepared to offer you a
            starting salary of <strong>$80,000 per year</strong> for this role, along with our standard benefits
            package.
          </p>
          <p className="sim-portal-message-body">
            <strong>Interview details</strong>
            <br />
            Date/Time: Thursday at 10:30 AM
            <br />
            Location: 482 Meridian Business Park, Suite 210
          </p>
          <p className="sim-portal-message-body">
            Please reply to this email to confirm, or to discuss the details further. We look forward to meeting
            you.
          </p>
          <p className="sim-portal-message-body">
            Warm regards,
            <br />
            The Hiring Team
            <br />
            {COMPANY_NAME}
          </p>
          <p className="sim-portal-hint">{ready ? 'You may continue.' : `You can continue in ${secondsLeft}s`}</p>
          <div className="btn-row">
            <button type="button" className="btn btn-primary" disabled={!ready} onClick={handleContinueToDraft}>
              Reply to This Email
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'draft') {
    return (
      <div className="sim-portal" role="group" aria-label="Drafting a reply email to the employer">
        <div className="sim-portal-disclaimer">Simulated scenario for this study, nothing you write here is sent anywhere</div>
        <div className="sim-readaloud-window">
          <div className="disclaimer-banner" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
            <strong>Your task:</strong> write a short reply asking for a higher starting salary — specifically{' '}
            <strong>$90,000 a year</strong> — instead of the $80,000 that was offered.
          </div>
          <div className="field-block">
            <label className="field-label">To</label>
            <input type="text" value={`Hiring Team <hiring@horizonretailgroup.example>`} readOnly disabled />
          </div>
          <div className="field-block">
            <label className="field-label">Subject</label>
            <input type="text" value={`Re: ${SUBJECT}`} readOnly disabled />
          </div>
          <div className="field-block">
            <label className="field-label" htmlFor="offer-reply">Your reply</label>
            <textarea
              id="offer-reply"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your reply here, asking for $90,000 a year..."
              style={{ minHeight: 140 }}
            />
          </div>
          <div className="btn-row">
            <button type="button" className="btn btn-primary" disabled={!replyText.trim()} onClick={handleSendReply}>
              Send Reply
            </button>
          </div>
        </div>
      </div>
    );
  }

  // phase === 'response'
  return (
    <div className="sim-portal" role="group" aria-label="Simulated employer response email">
      <div className="sim-portal-disclaimer">Simulated scenario for this study</div>
      <div className="sim-readaloud-window">
        <p className="sim-portal-message-subject" style={{ display: 'block', marginBottom: 4 }}>{`Re: ${SUBJECT}`}</p>
        <p className="sim-portal-hint" style={{ textAlign: 'left', marginBottom: 14 }}>
          From: Hiring Team &lt;hiring@horizonretailgroup.example&gt;
        </p>
        <p className="sim-portal-message-body">Hi again,</p>
        <p className="sim-portal-message-body">
          Thank you for your note, and for being upfront about what you&rsquo;re looking for, we appreciate that.
        </p>
        <p className="sim-portal-message-body">
          We did some checking on our end, and while $90,000 is outside our budget for this role, we&rsquo;d be
          glad to meet in the middle: we can offer <strong>$85,000 per year</strong> instead of our original offer.
          We feel that reflects your qualifications fairly while staying within what we&rsquo;re able to offer.
        </p>
        <p className="sim-portal-message-body">
          Let us know if that works for you, and we&rsquo;ll get everything finalized ahead of your interview.
        </p>
        <p className="sim-portal-message-body">
          Best,
          <br />
          The Hiring Team
          <br />
          {COMPANY_NAME}
        </p>
        <p className="sim-portal-hint">{ready ? 'You may continue.' : `You can continue in ${secondsLeft}s`}</p>
        <div className="btn-row">
          <button type="button" className="btn btn-primary" disabled={!ready} onClick={onComplete}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
