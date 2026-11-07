import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import AssessmentForm from '../components/AssessmentForm.jsx';
import { useStudy } from '../context/StudyContext.jsx';
import { api } from '../api.js';
import { formatDuration } from '../utils/formatDuration.js';

export default function FinalAssessment() {
  const navigate = useNavigate();
  const { protocol, participant, categoryName } = useStudy();
  const [busy, setBusy] = useState(false);
  const rolling = protocol?.sessionTimingMode === 'rolling';

  // Same as ExposureIntro.jsx: if the final assessment is reachable only
  // because the researcher approved a "more time" request, say so plainly.
  const [grantedHours, setGrantedHours] = useState(0);
  useEffect(() => {
    if (!participant || !rolling) return;
    let cancelled = false;
    api
      .getExtensionRequests(participant.studyCode)
      .then((requests) => {
        if (cancelled) return;
        const total = requests
          .filter((r) => r.sessionLabel === 'final' && r.status === 'approved')
          .reduce((sum, r) => sum + (r.grantedHours || 0), 0);
        setGrantedHours(total);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participant, rolling]);

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
        {grantedHours > 0 && (
          <div className="disclaimer-banner" style={{ background: 'var(--calm-teal-soft)', borderColor: '#bfe6d5', color: '#0b5d3f' }}>
            <strong>Good news:</strong> the researcher gave you {formatDuration(grantedHours)} of extra time to start
            your final assessment, which is why it&rsquo;s open again.
          </div>
        )}
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
