import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { useStudy } from '../context/StudyContext.jsx';
import { api } from '../api.js';
import { resolveResumeRoute } from '../utils/flow.js';

export default function ParticipantCode() {
  const navigate = useNavigate();
  const { protocol, setParticipant } = useStudy();
  const [mode, setMode] = useState('new'); // 'new' | 'returning'
  const [appMode, setAppMode] = useState(null);
  const [generatedCode, setGeneratedCode] = useState(null);
  const [confirmInput, setConfirmInput] = useState('');
  const [returningCode, setReturningCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getAppMode().then(setAppMode).catch(() => setAppMode({ appMode: 'demo', irbApproved: false }));
  }, []);

  const realAvailable = appMode?.appMode === 'real' && appMode?.irbApproved;
  const isDemoRun = !realAvailable;

  async function handleGenerate() {
    setBusy(true);
    setError('');
    try {
      const p = await api.createParticipant(isDemoRun);
      setGeneratedCode(p.studyCode);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function normalize(s) {
    return s.trim().toUpperCase().replace(/\s+/g, '');
  }

  async function handleConfirmNewCode() {
    setBusy(true);
    setError('');
    try {
      await api.ackConsent(generatedCode);
      const p = await api.getParticipant(generatedCode);
      setParticipant(p);
      const route = await resolveResumeRoute(p, protocol);
      navigate(route);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleReturning() {
    setBusy(true);
    setError('');
    try {
      const p = await api.getParticipant(returningCode);
      setParticipant(p);
      const route = await resolveResumeRoute(p, protocol);
      navigate(route);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Layout>
      <div className="card">
        <h1 className="screen-title">Your Study Code</h1>
        <p className="lead">
          Instead of your name, this study uses an anonymous, randomly generated study code. Please do not share it
          with anyone else, and keep a copy so you can return to later sessions.
        </p>

        {isDemoRun && (
          <div className="disclaimer-banner">
            This server is currently in <strong>DEMO mode</strong>, codes generated here are practice codes only
            and are clearly marked as demo data.
          </div>
        )}

        <div className="mode-toggle">
          <button className={mode === 'new' ? 'active' : ''} onClick={() => setMode('new')}>
            New Participant
          </button>
          <button className={mode === 'returning' ? 'active' : ''} onClick={() => setMode('returning')}>
            Returning Participant
          </button>
        </div>

        {mode === 'new' && (
          <>
            {!generatedCode ? (
              <button className="btn btn-primary" onClick={handleGenerate} disabled={busy}>
                Generate My Study Code
              </button>
            ) : (
              <>
                <div className="code-display">{generatedCode}</div>
                <p className="lead" style={{ fontSize: '0.95rem' }}>
                  Write this code down now. Type it below to confirm you've saved it, then continue.
                </p>
                <div className="field-block">
                  <label className="field-label" htmlFor="confirm-code">
                    Re-type your study code
                  </label>
                  <input
                    id="confirm-code"
                    type="text"
                    value={confirmInput}
                    onChange={(e) => setConfirmInput(e.target.value)}
                    placeholder={generatedCode}
                    autoComplete="off"
                  />
                </div>
                <button
                  className="btn btn-primary"
                  disabled={busy || normalize(confirmInput) !== normalize(generatedCode)}
                  onClick={handleConfirmNewCode}
                >
                  Continue
                </button>
              </>
            )}
          </>
        )}

        {mode === 'returning' && (
          <>
            <div className="field-block">
              <label className="field-label" htmlFor="returning-code">
                Enter your study code
              </label>
              <input
                id="returning-code"
                type="text"
                value={returningCode}
                onChange={(e) => setReturningCode(e.target.value)}
                placeholder="ABC-123"
                autoComplete="off"
              />
            </div>
            <button className="btn btn-primary" disabled={busy || !returningCode.trim()} onClick={handleReturning}>
              Continue
            </button>
          </>
        )}

        {error && <p className="error-text">{error}</p>}
      </div>
    </Layout>
  );
}
