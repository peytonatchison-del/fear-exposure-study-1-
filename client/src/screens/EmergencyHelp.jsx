import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { useStudy } from '../context/StudyContext.jsx';
import { api } from '../api.js';

export default function EmergencyHelp() {
  const navigate = useNavigate();
  const { participant, clearParticipant } = useStudy();
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawn, setWithdrawn] = useState(false);

  async function handleWithdraw() {
    setWithdrawing(true);
    try {
      if (participant?.studyCode) await api.withdraw(participant.studyCode);
    } catch {
      // Even if the request fails, still let the participant stop locally.
    } finally {
      setWithdrawing(false);
      setWithdrawn(true);
      clearParticipant();
    }
  }

  return (
    <Layout hideHelp hideProgress>
      <div className="card">
        <h1 className="screen-title">If You Need to Stop</h1>

        <div className="warning-banner">
          <strong>Please stop the study now if you are feeling significantly distressed.</strong> This app is a
          research data-collection tool, not an emergency or treatment service, and the research team cannot see how
          you are feeling in real time.
        </div>

        <h2 className="section-title">What to do right now</h2>
        <ul style={{ color: 'var(--text-secondary)', lineHeight: 1.8, paddingLeft: 22 }}>
          <li>Stop looking at the study material immediately, you will not lose anything by stopping.</li>
          <li>Talk to a trusted adult (a parent, guardian, teacher, or school counselor) about how you're feeling.</li>
          <li>
            If you or someone else may be in immediate danger, call <strong>911</strong> (or your local emergency
            number) right away.
          </li>
          <li>
            In the United States, you can also call or text <strong>988</strong> (the Suicide &amp; Crisis Lifeline)
            to talk with someone at any time, for any kind of emotional distress.
          </li>
          <li>You can also reach out to your regular doctor, school counselor, or another professional you trust.</li>
        </ul>

        <p className="lead" style={{ marginTop: 20 }}>
          You are always free to stop participating in this study, for any reason, with no penalty.
        </p>

        {!withdrawn ? (
          <>
            <div className="critical-banner">
              <strong>Before you stop:</strong> this will permanently end your participation in this study. Once you
              stop, you will not be able to re-enter or resume &mdash; this cannot be undone.
            </div>
            <div className="btn-row">
              <button className="btn btn-danger" disabled={withdrawing} onClick={handleWithdraw}>
                {withdrawing ? 'Stopping…' : 'Stop the Study Now'}
              </button>
              <button className="btn btn-secondary" onClick={() => navigate(-1)}>
                Go Back
              </button>
            </div>
          </>
        ) : (
          <div className="btn-row">
            <p>You have stopped the study. Thank you for participating in whatever part you completed.</p>
            <button className="btn btn-primary" onClick={() => navigate('/')}>
              Return to Welcome Screen
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
