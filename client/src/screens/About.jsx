import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { useStudy } from '../context/StudyContext.jsx';

export default function About() {
  const navigate = useNavigate();
  const { protocol } = useStudy();

  return (
    <Layout hideProgress>
      <div className="card">
        <h1 className="screen-title">Research Information</h1>
        <p className="lead">Please read this information about the study.</p>
        <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          {protocol?.consentText || 'Loading study information…'}
        </div>
        <div className="btn-row">
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>
            Back
          </button>
        </div>
      </div>
    </Layout>
  );
}
