import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { useStudy } from '../context/StudyContext.jsx';

export default function Complete() {
  const navigate = useNavigate();
  const { participant, clearParticipant } = useStudy();

  function handleDone() {
    clearParticipant();
    navigate('/');
  }

  return (
    <Layout hideProgress>
      <div className="card centered-message">
        <h1 className="screen-title">Thank You</h1>
        <p className="lead">
          You have completed all parts of this research study. Your responses have been recorded under study code{' '}
          <strong>{participant?.studyCode}</strong>.
        </p>
        <div className="disclaimer-banner">
          This was a research study, not a treatment program. If you have any questions about the study, please
          contact the research team through your school or the contact information provided in the study
          information sheet.
        </div>
        <div className="btn-row">
          <button className="btn btn-primary" onClick={handleDone}>
            Done
          </button>
        </div>
      </div>
    </Layout>
  );
}
