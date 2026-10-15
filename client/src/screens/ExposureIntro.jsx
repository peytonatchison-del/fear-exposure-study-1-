import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { useStudy } from '../context/StudyContext.jsx';

export default function ExposureIntro() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { participant, categoryName } = useStudy();
  const sessionNumber = Number(params.get('session') || participant?.currentSessionNumber || 1);

  if (!participant) {
    navigate('/participant-code');
    return null;
  }

  return (
    <Layout>
      <div className="card">
        <h1 className="screen-title">Before You Begin, Session {sessionNumber}</h1>
        <p className="lead">
          You are about to see standardized digital material related to <strong>{categoryName}</strong>. Please read
          the following before continuing:
        </p>

        <div className="disclaimer-banner" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
          <strong>What you're about to see:</strong> a short scenario related to {categoryName || 'this category'},
          it could be a brief passage to read, an image, or a short interactive scenario. We're keeping this
          description vague on purpose so it doesn't spoil the exposure itself.
        </div>

        <div className="disclaimer-banner" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
          <strong>What this is for:</strong> the point isn't to test whether you can "get through it," it's to give
          you a controlled, low-stakes chance to notice what you feel before, during, and after, and to compare what
          you expected would happen against what actually happened. You'll be asked about both right after.
        </div>

        <ul style={{ color: 'var(--text-secondary)', lineHeight: 1.8, paddingLeft: 22 }}>
          <li>You may stop at any time, for any reason.</li>
          <li>
            You should <strong>not continue</strong> if you become significantly distressed. If that happens, use the
            "Need help / Stop" button at the top of the screen.
          </li>
          <li>This app is not providing medical or mental-health treatment.</li>
          <li>Your responses are being collected for research according to the approved study protocol.</li>
        </ul>
        <div className="btn-row">
          <button className="btn btn-primary" onClick={() => navigate(`/session/${sessionNumber}`)}>
            I Understand, Begin Exposure Session
          </button>
        </div>
      </div>
    </Layout>
  );
}
