import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { useStudy } from '../context/StudyContext.jsx';

export default function BetweenSessions() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { participant } = useStudy();
  const availableAt = Number(params.get('availableAt'));
  const sessionParam = params.get('session');
  const isFinal = sessionParam === 'final';
  const session = isFinal ? null : Number(sessionParam);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  if (!participant) {
    navigate('/participant-code');
    return null;
  }

  const msLeft = availableAt - now;
  const ready = msLeft <= 0;
  const daysLeft = Math.ceil(msLeft / 86400000);
  const readableDate = Number.isFinite(availableAt) ? new Date(availableAt).toLocaleString() : '';

  return (
    <Layout>
      <div className="card centered-message">
        <h1 className="screen-title">Session Complete, Thank You</h1>
        {ready ? (
          <>
            <p className="lead">{isFinal ? 'Your final assessment is now available.' : 'Your next session is now available.'}</p>
            <div className="btn-row">
              <button
                className="btn btn-primary"
                onClick={() => navigate(isFinal ? '/final-assessment' : `/exposure-intro?session=${session}`)}
              >
                {isFinal ? 'Begin Final Assessment' : `Begin Session ${session}`}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="lead">
              {isFinal ? 'Your final assessment' : `Your next session (${session})`} will be available on{' '}
              <strong>{readableDate}</strong> ({daysLeft} day
              {daysLeft === 1 ? '' : 's'} from now). You can close this tab and come back later using your study
              code.
            </p>
            {participant.isDemo && (
              <div className="btn-row">
                <button
                  className="btn btn-secondary"
                  onClick={() => navigate(isFinal ? '/final-assessment' : `/exposure-intro?session=${session}`)}
                >
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
