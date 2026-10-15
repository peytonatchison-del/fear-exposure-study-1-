import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { useStudy } from '../context/StudyContext.jsx';

export default function Welcome() {
  const navigate = useNavigate();
  const { protocol, loading, protocolError } = useStudy();

  return (
    <Layout hideProgress>
      <div className="card">
        <h1 className="screen-title">Online Fear Exposure Research Study</h1>
        <p className="lead">
          This research study examines changes in self-reported fear during repeated exposure to standardized
          digital material, including short readings, images, and interactive simulations.
        </p>

        <div className="disclaimer-banner">
          <strong>Research Study Disclaimer:</strong> This app is a data-collection tool for a research study. It is
          not a therapy or treatment program, does not diagnose any condition, and does not guarantee any change in
          how you feel. You may stop participating at any time.
        </div>

        <div className="warning-banner">
          <strong>Before you begin:</strong> if you become significantly distressed at any point during this study,
          please stop and talk to a school counselor (or another trusted adult).
        </div>

        {protocolError && (
          <p className="error-text">
            Could not reach the study server ({protocolError}). Make sure the backend is running.
          </p>
        )}
        {protocol && !protocol.irbApproved && protocol.appMode === 'real' && (
          <p className="warning-banner">
            This server is configured for real data collection, but the researcher has not yet completed the IRB
            checklist. Real participation is currently blocked.
          </p>
        )}

        <div className="btn-row">
          <button
            className="btn btn-primary"
            disabled={loading}
            onClick={() => navigate('/consent')}
          >
            Begin Study
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/about')}>
            Research Information
          </button>
        </div>

        <div className="researcher-entry-row">
          <button className="researcher-entry-link" onClick={() => navigate('/researcher/login')}>
            If you're a researcher, click here
          </button>
        </div>
      </div>
    </Layout>
  );
}
