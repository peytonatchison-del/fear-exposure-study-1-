import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';

export default function Withdrawn() {
  const navigate = useNavigate();
  return (
    <Layout hideProgress>
      <div className="card centered-message">
        <h1 className="screen-title">Study Stopped</h1>
        <p className="lead">This study code has been marked as withdrawn and can no longer be used to continue.</p>
        <div className="btn-row">
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Return to Welcome Screen
          </button>
        </div>
      </div>
    </Layout>
  );
}
