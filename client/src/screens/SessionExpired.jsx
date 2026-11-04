import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { useStudy } from '../context/StudyContext.jsx';
import { api } from '../api.js';

// Reached only under "rolling" session timing, when a participant shows up
// after a session's unlock window (rollingUnlockHours later, open for
// rollingWindowHours) has already closed, and they never started it.
//
// This used to be a hard dead end — the next session's own window is
// computed off this one's completion time, which never got set, so there was
// nothing further to route them to. Now it offers a way out: the
// participant can ask the researcher for more time. flow.js adds any
// *approved* extra hours onto the window before deciding whether to send
// someone here at all, so if an approved request's extended window is still
// open, the participant never lands on this screen in the first place —
// they go straight through to the session (with a "you were granted more
// time" note, see ExposureIntro.jsx / FinalAssessment.jsx). This screen only
// needs to handle: no request yet, a pending one, a denied one, or an
// approved one whose extended window has itself now also passed.
export default function SessionExpired() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { participant } = useStudy();
  const sessionParam = params.get('session');
  const isFinal = sessionParam === 'final';
  const closedAt = Number(params.get('closedAt'));
  const readableClosedAt = Number.isFinite(closedAt) ? new Date(closedAt).toLocaleString() : '';

  const [loading, setLoading] = useState(true);
  const [latestRequest, setLatestRequest] = useState(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!participant) {
      navigate('/participant-code');
      return;
    }
    let cancelled = false;
    api
      .getExtensionRequests(participant.studyCode)
      .then((requests) => {
        if (cancelled) return;
        // Requests come back newest-first; the most recent one for this
        // session is what drives what the participant sees here.
        const mine = requests.find((r) => r.sessionLabel === sessionParam);
        setLatestRequest(mine || null);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participant, sessionParam]);

  if (!participant) return null;

  async function handleRequest() {
    setSubmitting(true);
    setError('');
    try {
      const created = await api.requestExtension(participant.studyCode, sessionParam, note.trim());
      setLatestRequest(created);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const sessionLabel = isFinal ? 'your final assessment' : `Session ${sessionParam}`;
  const isPending = latestRequest?.status === 'pending';
  const isDenied = latestRequest?.status === 'denied';
  // An approved request only ever lands someone back on this screen if its
  // extended window has ALSO now passed (see the big comment above) — a
  // still-open approved extension sends them to the session instead.
  const isApprovedButAlsoExpired = latestRequest?.status === 'approved';
  const canRequest = !isPending;

  return (
    <Layout hideProgress>
      <div className="card centered-message">
        <h1 className="screen-title">Session Window Closed</h1>
        <p className="lead">
          {isFinal
            ? 'The window to complete your final assessment has closed.'
            : `The window to complete Session ${sessionParam} has closed.`}
          {readableClosedAt && (
            <>
              {' '}
              It was available until <strong>{readableClosedAt}</strong>.
            </>
          )}
        </p>
        <p className="lead">
          This study is designed around completing each session within a set window after the one before it, so
          results stay comparable across participants. That window has now passed, so this session can&rsquo;t be
          started from here.
        </p>

        {!loading && (
          <>
            {isPending && (
              <div className="disclaimer-banner" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                <strong>Request sent.</strong> You&rsquo;ve asked the researcher for more time on {sessionLabel}. Check
                back within 24 hours to see whether it&rsquo;s been approved, or email the contact listed in your
                Volunteer Information Packet if you don&rsquo;t hear back.
              </div>
            )}
            {isDenied && (
              <div className="disclaimer-banner" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                <strong>Your earlier request wasn&rsquo;t approved.</strong> If you still need more time, you&rsquo;re
                welcome to send another request below, or email the contact in your Volunteer Information Packet.
              </div>
            )}
            {isApprovedButAlsoExpired && (
              <div className="disclaimer-banner" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                <strong>You were previously given more time,</strong> but that extended window has also now passed.
                If you still need more time, you&rsquo;re welcome to send another request below.
              </div>
            )}

            {canRequest && (
              <>
                <p className="lead" style={{ marginBottom: 8 }}>
                  You can ask the researcher for more time on {sessionLabel}.
                </p>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Anything you'd like the researcher to know? (optional)"
                  style={{ width: '100%', minHeight: 70, marginBottom: 10 }}
                />
                {error && <p className="error-text">{error}</p>}
                <div className="btn-row">
                  <button className="btn btn-primary" disabled={submitting} onClick={handleRequest}>
                    {submitting ? 'Sending…' : 'Request More Time'}
                  </button>
                </div>
                <p className="lead" style={{ fontSize: '0.85rem' }}>
                  After you send a request, check back within 24 hours to see if it&rsquo;s been approved, or email
                  the contact listed in your Volunteer Information Packet.
                </p>
              </>
            )}
          </>
        )}

        <div className="btn-row">
          <button className="btn btn-secondary" onClick={() => navigate('/')}>
            Return to Welcome Screen
          </button>
        </div>
      </div>
    </Layout>
  );
}
