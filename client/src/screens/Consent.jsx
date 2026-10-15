import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { useStudy } from '../context/StudyContext.jsx';

export default function Consent() {
  const navigate = useNavigate();
  const { protocol } = useStudy();
  const [checked, setChecked] = useState(false);

  return (
    <Layout>
      <div className="card">
        <h1 className="screen-title">Study Information &amp; Consent</h1>
        <p className="lead">
          Please read the information below carefully before continuing. This section reflects whatever
          information/consent (or parental consent + minor assent) language the IRB has approved for this study.
        </p>
        <div
          style={{
            whiteSpace: 'pre-wrap',
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
            background: 'var(--surface-2)',
            borderRadius: 'var(--radius)',
            padding: 18,
            maxHeight: 320,
            overflowY: 'auto',
          }}
        >
          {protocol?.consentText || 'Loading study information…'}
        </div>

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 20, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            style={{ marginTop: 4, width: 20, height: 20 }}
          />
          <span>
            I have read and understood this information, I am participating voluntarily, and I agree (or, if I am a
            minor, I assent along with any required guardian/parental consent) to take part in this research study.
          </span>
        </label>

        <div className="btn-row">
          <button className="btn btn-primary" disabled={!checked} onClick={() => navigate('/participant-code')}>
            Continue
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/')}>
            Back
          </button>
        </div>
      </div>
    </Layout>
  );
}
