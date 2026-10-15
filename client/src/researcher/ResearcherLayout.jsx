import React, { useEffect, useState } from 'react';
import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useResearcherAuth } from './ResearcherAuth.jsx';
import { api } from '../api.js';

const TABS = [
  { to: '/researcher/overview', label: 'Overview & Data' },
  { to: '/researcher/participants', label: 'Participants' },
  { to: '/researcher/protocol', label: 'Protocol' },
  { to: '/researcher/stimuli', label: 'Stimuli' },
  { to: '/researcher/irb', label: 'IRB Checklist' },
  { to: '/researcher/export', label: 'Export Data' },
  { to: '/researcher/account', label: 'Account' },
];

export default function ResearcherLayout() {
  const { token, checked, displayName, logout } = useResearcherAuth();
  const navigate = useNavigate();
  const [appMode, setAppMode] = useState(null);

  useEffect(() => {
    api.getAppMode().then(setAppMode).catch(() => {});
  }, []);

  if (!checked) return null;
  if (!token) return <Navigate to="/researcher/login" replace />;

  return (
    <div className="rd-shell">
      <aside className="rd-sidebar">
        <div className="rd-sidebar__title">Fear-Exposure Study</div>
        {appMode && (
          <div className={`badge ${appMode.appMode === 'real' ? (appMode.irbApproved ? 'badge-real' : 'badge-blocked') : 'badge-demo'}`}>
            {appMode.appMode === 'real' ? (appMode.irbApproved ? 'REAL — IRB APPROVED' : 'REAL — IRB BLOCKED') : 'DEMO MODE'}
          </div>
        )}
        <nav className="rd-nav">
          {TABS.map((tab) => (
            <NavLink key={tab.to} to={tab.to} className={({ isActive }) => `rd-nav__link${isActive ? ' active' : ''}`}>
              {tab.label}
            </NavLink>
          ))}
        </nav>
        <div className="rd-sidebar__footer">
          <div className="rd-sidebar__user">
            <div className="rd-sidebar__user-role">Researcher</div>
            {displayName && <div className="rd-sidebar__user-name">{displayName}</div>}
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => {
              logout();
              navigate('/researcher/login');
            }}
          >
            Log Out
          </button>
          <a href="/" className="rd-sidebar__back">
            ← Back to participant app
          </a>
        </div>
      </aside>
      <div className="rd-content">
        <Outlet />
      </div>
    </div>
  );
}
