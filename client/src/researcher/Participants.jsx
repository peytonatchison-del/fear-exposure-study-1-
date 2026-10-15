import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { formatTimestamp } from '../utils/formatTimestamp.js';

export default function Participants() {
  const [rows, setRows] = useState([]);
  const [includeDemo, setIncludeDemo] = useState(true);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function load() {
    api.getParticipants(includeDemo).then(setRows).catch((err) => setError(err.message));
  }

  useEffect(load, [includeDemo]);

  async function openDetail(code) {
    setDetail(await api.getParticipantDetail(code));
  }

  async function handleClearDemo() {
    if (!window.confirm('Delete all demo participants and their data? This cannot be undone.')) return;
    setBusy(true);
    try {
      await api.deleteDemoData();
      load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="screen-title">Participants</h1>
      <p className="lead">No names or contact information are ever collected — participants are identified only by study code.</p>

      <div className="rd-row" style={{ marginBottom: 16 }}>
        <label className="rd-inline-check">
          <input type="checkbox" checked={includeDemo} onChange={(e) => setIncludeDemo(e.target.checked)} />
          Include demo participants
        </label>
        <button className="btn btn-danger" style={{ width: 'auto' }} disabled={busy} onClick={handleClearDemo}>
          Clear All Demo Data
        </button>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="rd-card" style={{ overflowX: 'auto' }}>
        <table className="rd-table">
          <thead>
            <tr>
              <th>Study Code</th>
              <th>Category</th>
              <th>Demo?</th>
              <th>Status</th>
              <th>Session</th>
              <th>Baseline</th>
              <th>Final</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.studyCode}>
                <td>{r.studyCode}</td>
                <td>{r.fearCategoryId || '—'}</td>
                <td>{r.isDemo ? 'Yes' : 'No'}</td>
                <td>{r.status}</td>
                <td>{r.currentSessionNumber}</td>
                <td>{r.hasBaseline ? '✓' : '—'}</td>
                <td>{r.hasFinal ? '✓' : '—'}</td>
                <td>
                  <button className="btn btn-secondary" style={{ width: 'auto' }} onClick={() => openDetail(r.studyCode)}>
                    View
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>
                  No participants yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {detail && (
        <div className="rd-card">
          <h2 className="section-title" style={{ marginTop: 0 }}>
            Participant {detail.studyCode}
          </h2>
          <p>
            Category: <strong>{detail.fearCategoryId}</strong> &middot; Status: <strong>{detail.status}</strong> &middot; Demo:{' '}
            <strong>{detail.isDemo ? 'Yes' : 'No'}</strong>
          </p>

          <h3>Assessments</h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="rd-table">
              <thead>
                <tr>
                  <th>Phase</th>
                  <th>Anxiety</th>
                  <th>Fear</th>
                  <th>GAD-7 Total</th>
                  <th>What helped most</th>
                  <th>What could improve</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {detail.assessments.map((a) => (
                  <tr key={a.id}>
                    <td>{a.phase}</td>
                    <td>{a.anxiety_now}</td>
                    <td>{a.fear_rating}</td>
                    <td>{a.questionnaire_total ?? '—'}</td>
                    <td style={{ maxWidth: 220, whiteSpace: 'pre-wrap' }}>{a.helped_most || '—'}</td>
                    <td style={{ maxWidth: 220, whiteSpace: 'pre-wrap' }}>{a.could_improve || '—'}</td>
                    <td>{formatTimestamp(a.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3>Exposure Responses</h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="rd-table">
              <thead>
                <tr>
                  <th>Session</th>
                  <th>Level</th>
                  <th>Pre</th>
                  <th>During</th>
                  <th>Post</th>
                  <th>What they expected</th>
                  <th>What actually happened</th>
                  <th>Since last session</th>
                  <th>Recording</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {detail.exposures.map((e) => (
                  <tr key={e.id}>
                    <td>{e.session_number}</td>
                    <td>{e.exposure_level}</td>
                    <td>{e.pre_rating}</td>
                    <td>{e.during_rating}</td>
                    <td>{e.post_rating}</td>
                    <td style={{ maxWidth: 220, whiteSpace: 'pre-wrap' }}>{e.expected_text || '—'}</td>
                    <td style={{ maxWidth: 220, whiteSpace: 'pre-wrap' }}>{e.actual_text || '—'}</td>
                    <td style={{ maxWidth: 220, whiteSpace: 'pre-wrap' }}>{e.reflection_text || '—'}</td>
                    <td>
                      {e.recording_url ? (
                        <video src={e.recording_url} controls style={{ width: 160, maxWidth: '100%', borderRadius: 8 }} />
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>{formatTimestamp(e.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button className="btn btn-secondary" style={{ width: 'auto', marginTop: 12 }} onClick={() => setDetail(null)}>
            Close
          </button>
        </div>
      )}
    </div>
  );
}
