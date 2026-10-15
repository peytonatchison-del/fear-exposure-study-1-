import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { useStudy } from '../context/StudyContext.jsx';
import { api } from '../api.js';

export default function FearCategory() {
  const navigate = useNavigate();
  const { protocol, participant, setParticipant } = useStudy();
  const [selected, setSelected] = useState(participant?.fearCategoryId || null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!participant) {
    navigate('/participant-code');
    return null;
  }

  async function handleContinue() {
    setBusy(true);
    setError('');
    try {
      const p = await api.setCategory(participant.studyCode, selected);
      setParticipant(p);
      navigate('/baseline');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Layout>
      <div className="card">
        <h1 className="screen-title">Choose a Fear Category</h1>
        <p className="lead">
          Select the category you would like this study to focus on. This choice cannot be changed later, since the
          rest of the study is tailored to it.
        </p>

        <div className="category-grid">
          {(protocol?.categories || []).map((cat) => (
            <button
              key={cat.id}
              className={`category-card${selected === cat.id ? ' selected' : ''}`}
              onClick={() => setSelected(cat.id)}
              type="button"
            >
              {cat.name}
              {cat.description && <div className="category-card__desc">{cat.description}</div>}
            </button>
          ))}
        </div>

        {error && <p className="error-text">{error}</p>}

        <div className="btn-row">
          <button className="btn btn-primary" disabled={!selected || busy} onClick={handleContinue}>
            Continue
          </button>
        </div>
      </div>
    </Layout>
  );
}
