import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import AssessmentForm from '../components/AssessmentForm.jsx';
import { useStudy } from '../context/StudyContext.jsx';
import { api } from '../api.js';

export default function FinalAssessment() {
  const navigate = useNavigate();
  const { protocol, participant, categoryName } = useStudy();
  const [busy, setBusy] = useState(false);

  if (!participant) {
    navigate('/participant-code');
    return null;
  }

  async function handleSubmit(payload) {
    setBusy(true);
    try {
      await api.submitAssessment(participant.studyCode, { phase: 'final', ...payload });
      navigate('/complete');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Layout>
      <div className="card">
        <h1 className="screen-title">Final Assessment</h1>
        <p className="lead">
          This is the same set of questions you answered at the very beginning of the study. Please answer based on
          how you feel right now.
        </p>
        <AssessmentForm
          categoryId={participant?.fearCategoryId}
          categoryName={categoryName}
          questionnaireItems={protocol?.questionnaireItems || []}
          onSubmit={handleSubmit}
          busy={busy}
          submitLabel="Finish Study"
          phase="final"
        />
      </div>
    </Layout>
  );
}
