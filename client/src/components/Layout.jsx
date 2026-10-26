import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useStudy } from '../context/StudyContext.jsx';

const STEP_ORDER = [
  { match: (p) => p === '/' || p.startsWith('/about') || p.startsWith('/consent'), step: 1 },
  { match: (p) => p.startsWith('/participant-code'), step: 2 },
  { match: (p) => p.startsWith('/fear-category'), step: 3 },
  { match: (p) => p.startsWith('/baseline'), step: 4 },
  { match: (p) => p.startsWith('/exposure-intro'), step: 5 },
  { match: (p) => p.startsWith('/session') && p.includes('summary'), step: 7 },
  { match: (p) => p.startsWith('/session'), step: 6 },
  { match: (p) => p.startsWith('/between-sessions'), step: 8 },
  { match: (p) => p.startsWith('/final-assessment'), step: 9 },
  { match: (p) => p.startsWith('/complete'), step: 10 },
];
const TOTAL_STEPS = 10;

function currentStep(pathname) {
  const found = STEP_ORDER.find((s) => s.match(pathname));
  return found ? found.step : null;
}

export default function Layout({ children, hideProgress = false, hideHelp = false }) {
  const location = useLocation();
  const { participant } = useStudy();
  const step = currentStep(location.pathname);
  const isDemo = participant?.isDemo;
  const hideChrome = location.pathname.startsWith('/researcher');

  if (hideChrome) return children;

  return (
    <>
      {isDemo && <div className="demo-banner">DEMO MODE &mdash; practice run only, no real study data is being collected</div>}
      <header className="app-header">
        <span className="app-header__title">Online Fear Exposure Research Study</span>
        {!hideHelp && (
          <div className="header-actions">
            <Link to="/pause" className="pause-button">
              Pause
            </Link>
            <Link to="/help" className="help-button">
              Need help / Stop
            </Link>
          </div>
        )}
      </header>
      <main className="app-shell">
        {!hideProgress && step && (
          <>
            <div className="progress-label">Step {step} of {TOTAL_STEPS}</div>
            <div className="progress-bar">
              <div className="progress-bar__fill" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
            </div>
          </>
        )}
        {children}
        <p className="footer-note">
          This is a research study, not a medical or mental-health treatment service. You may stop at any time.
        </p>
      </main>
    </>
  );
}
