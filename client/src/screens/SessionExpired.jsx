import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { useStudy } from '../context/StudyContext.jsx';

// Reached only under "rolling" session timing, when a participant shows up
// after a session's unlock window (rollingUnlockHours later, open for
// rollingWindowHours) has already closed, and they never started it. This is
// a dead end by design — the next session's own window is computed off this
// one's completion time, which never got set, so there's nothing further to
// route them to. It's deliberately calm/neutral rather than alarming, since
// missing a window isn't a safety event the way withdrawing is.
export default function SessionExpired() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { participant } = useStudy();
  const sessionParam = params.get('session');
  const isFinal = sessionParam === 'final';
  const closedAt = Number(params.get('closedAt'));
  const readableClosedAt = Number.isFinite(closedAt) ? new Date(closedAt).toLocaleString() : '';

  useEffect(() => {
    if (!participant) navigate('/participant-code');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participant]);

  if (!participant) return null;

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
        <p className="lead">
          If you think this is a mistake, or have questions, please reach out using the contact information in your
          Volunteer Information Packet.
        </p>
        <div className="btn-row">
          <button className="btn btn-secondary" onClick={() => navigate('/')}>
            Return to Welcome Screen
          </button>
        </div>
      </div>
    </Layout>
  );
}
