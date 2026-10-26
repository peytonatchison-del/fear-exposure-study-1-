import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';

// Reached from the "Pause" button in the top header, available throughout the
// study. Pausing needs no backend change at all: the participant's progress
// is already saved after every step, so leaving and typing the same study
// code back in later resumes them exactly where they left off (see
// resolveResumeRoute in utils/flow.js). This screen just confirms that to them.
export default function Pause() {
  const navigate = useNavigate();
  return (
    <Layout hideProgress>
      <div className="card centered-message">
        <h1 className="screen-title">Study Paused</h1>
        <p className="lead">
          You've paused the study. Nothing else is required right now &mdash; you can come back and continue from
          here later using your participant code, whenever you're ready.
        </p>
        <div className="btn-row">
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Return to Welcome Screen
          </button>
        </div>
      </div>
    </Layout>
  );
}
