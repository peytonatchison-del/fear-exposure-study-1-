import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { useStudy } from '../context/StudyContext.jsx';

export default function BetweenSessions() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { participant } = useStudy();
  const availableAt = Number(params.get('availableAt'));
  const expiresAtParam = params.get('expiresAt');
  const expiresAt = expiresAtParam !== null ? Number(expiresAtParam) : null;
  const sessionParam = params.get('session');
  const isFinal = sessionParam === 'final';
  const isBaseline = sessionParam === 'baseline';
  const session = isFinal || isBaseline ? null : Number(sessionParam);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  // Redirect in an effect rather than directly in render — this screen is
  // usually landed on right after another screen's own navigate() call
  // (e.g. Baseline redirecting here), and calling navigate() again straight
  // from render in that situation can crash the whole app silently. See the
  // matching comment in Baseline.jsx.
  useEffect(() => {
    if (!participant) {
      navigate('/participant-code');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participant]);

  if (!participant) {
    return null;
  }

  const msLeft = availableAt - now;
  const ready = msLeft <= 0;
  const daysLeft = Math.ceil(msLeft / 86400000);
  const readableDate = Number.isFinite(availableAt)
    ? isBaseline
      ? new Date(availableAt).toLocaleDateString()
      : new Date(availableAt).toLocaleString()
    : '';
  const readableExpiry = Number.isFinite(expiresAt) ? new Date(expiresAt).toLocaleString() : '';

  const destination = isFinal ? '/final-assessment' : isBaseline ? '/baseline' : `/exposure-intro?session=${session}`;
  // Baseline re-checks the study-open date itself on every visit (it has
  // several entry points), so the demo skip-wait button needs to tell it
  // explicitly to let this one visit through instead of bouncing right back.
  const skipDestination = isBaseline ? '/baseline?skipWait=1' : destination;

  return (
    <Layout>
      <div className="card centered-message">
        <h1 className="screen-title">{isBaseline ? 'Stressor Exposure Study' : 'Session Complete, Thank You'}</h1>
        {ready ? (
          <>
            <p className="lead">
              {isFinal
                ? 'Your final assessment is now available.'
                : isBaseline
                ? 'The study is now open.'
                : 'Your next session is now available.'}
            </p>
            <div className="btn-row">
              <button className="btn btn-primary" onClick={() => navigate(destination)}>
                {isFinal ? 'Begin Final Assessment' : isBaseline ? 'Begin Baseline Assessment' : `Begin Session ${session}`}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="lead">
              {isBaseline ? (
                <>
                  The study will open on <strong>{readableDate}</strong>. You can&rsquo;t start the baseline
                  assessment or Session 1 before then &mdash; please close this tab and come back on that date using
                  your study code.
                </>
              ) : (
                <>
                  {isFinal ? 'Your final assessment' : `Your next session (${session})`} will be available on{' '}
                  <strong>{readableDate}</strong> ({daysLeft} day
                  {daysLeft === 1 ? '' : 's'} from now). You can close this tab and come back later using your study
                  code.
                  {readableExpiry && (
                    <>
                      {' '}
                      Once it unlocks, you&rsquo;ll need to start it before <strong>{readableExpiry}</strong>, after
                      which that window closes.
                    </>
                  )}
                </>
              )}
            </p>
            {participant.isDemo && (
              <div className="btn-row">
                <button className="btn btn-secondary" onClick={() => navigate(skipDestination)}>
                  Skip wait (demo mode only)
                </button>
              </div>
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
