import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import AssessmentForm from '../components/AssessmentForm.jsx';
import { useStudy } from '../context/StudyContext.jsx';
import { api } from '../api.js';

// A baseline GAD-7 total above 15 falls in the questionnaire's "severe"
// anxiety band (0-4 minimal, 5-9 mild, 10-14 moderate, 15-21 severe). When
// that happens, the participant sees the distress-check screen below
// instead of being carried straight on to Session 1.
const GAD7_HIGH_SCORE_THRESHOLD = 15;

export default function Baseline() {
  const navigate = useNavigate();
  const { participant, protocol, categoryName, clearParticipant } = useStudy();
  const [busy, setBusy] = useState(false);
  // null = still filling out the form. Once submitted with a GAD-7 total
  // above the threshold, this becomes 'check' (showing the notice + the
  // three buttons) or 'paused' (after choosing Pause, showing the
  // come-back-later confirmation). Choosing Stop skips straight to the
  // existing /withdrawn screen via api.withdraw, same as EmergencyHelp.jsx.
  const [view, setView] = useState(null);
  const [stopping, setStopping] = useState(false);

  if (!participant) {
    navigate('/participant-code');
    return null;
  }

  async function handleSubmit(payload) {
    setBusy(true);
    try {
      const result = await api.submitAssessment(participant.studyCode, { phase: 'baseline', ...payload });
      if (typeof result?.questionnaireTotal === 'number' && result.questionnaireTotal > GAD7_HIGH_SCORE_THRESHOLD) {
        setView('check');
      } else {
        navigate('/exposure-intro?session=1');
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleStop() {
    setStopping(true);
    try {
      if (participant?.studyCode) await api.withdraw(participant.studyCode);
    } catch {
      // Even if the request fails, still let the participant stop locally.
    } finally {
      setStopping(false);
      clearParticipant();
      navigate('/withdrawn');
    }
  }

  if (view === 'check' || view === 'paused') {
    return (
      <Layout hideProgress>
        <div className="card">
          <h1 className="screen-title">Before You Continue</h1>

          <div className="warning-banner">
            <strong>Your answers on that check-in suggest a higher level of anxiety.</strong> If you are feeling
            significantly distressed, please stop and talk to a school counselor (or another trusted adult) before
            going any further.
          </div>

          {view === 'check' && (
            <>
              <p className="lead" style={{ marginTop: 20 }}>
                You can continue into the study, pause here for now, or stop the study altogether &mdash; whatever
                feels right for you.
              </p>
              <div className="btn-row">
                <button className="btn btn-primary" onClick={() => navigate('/exposure-intro?session=1')}>
                  Continue
                </button>
                <button className="btn btn-secondary" onClick={() => setView('paused')}>
                  Pause
                </button>
                <p className="lead" style={{ fontSize: '0.85rem', margin: '-6px 0 0' }}>
                  You can still come back and continue later if you choose.
                </p>
                <button className="btn btn-danger" disabled={stopping} onClick={handleStop}>
                  {stopping ? 'Stopping…' : 'Stop the Study'}
                </button>
                <p className="lead" style={{ fontSize: '0.85rem', margin: '-6px 0 0' }}>
                  If you stop, you will not be permitted to re-enter the study.
                </p>
              </div>
            </>
          )}

          {view === 'paused' && (
            <div className="btn-row">
              <p>
                You've paused the study. Nothing else is required right now &mdash; you can come back and continue
                from here later using your participant code, whenever you're ready.
              </p>
              <button className="btn btn-primary" onClick={() => navigate('/')}>
                Return to Welcome Screen
              </button>
            </div>
          )}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="card">
        <h1 className="screen-title">Baseline Assessment</h1>
        <p className="lead">
          Before you begin, please answer a few standardized questions honestly. There are no right or wrong
          answers.
        </p>
        <AssessmentForm
          categoryId={participant?.fearCategoryId}
          categoryName={categoryName}
          questionnaireItems={protocol?.questionnaireItems || []}
          onSubmit={handleSubmit}
          busy={busy}
          submitLabel="Continue"
          phase="baseline"
        />
      </div>
    </Layout>
  );
}
