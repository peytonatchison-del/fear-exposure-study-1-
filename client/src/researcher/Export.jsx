import React, { useState } from 'react';
import { api } from '../api.js';

const FILES = [
  { name: 'participants.csv', label: 'Participants (code, category, status)' },
  { name: 'exposure-responses.csv', label: 'Exposure Responses (pre/during/post ratings, written responses)' },
  { name: 'assessments.csv', label: 'Baseline & Final Assessments' },
];

export default function Export() {
  const [includeDemo, setIncludeDemo] = useState(false);
  const [error, setError] = useState('');
  const [busyFile, setBusyFile] = useState(null);

  async function handleDownload(name) {
    setBusyFile(name);
    setError('');
    try {
      await api.downloadExport(name, includeDemo);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyFile(null);
    }
  }

  return (
    <div>
      <h1 className="screen-title">Export Data</h1>
      <p className="lead">
        All exports are keyed only by anonymous study code — no names, emails, or other identifying information are
        ever stored, so there is nothing further to anonymize.
      </p>

      <label className="rd-inline-check" style={{ marginBottom: 16, display: 'inline-flex' }}>
        <input type="checkbox" checked={includeDemo} onChange={(e) => setIncludeDemo(e.target.checked)} />
        Include demo participants in export
      </label>

      {error && <p className="error-text">{error}</p>}

      <div className="rd-card">
        {FILES.map((f) => (
          <div key={f.name} className="rd-row" style={{ justifyContent: 'space-between' }}>
            <span>{f.label}</span>
            <button className="btn btn-primary" style={{ width: 'auto' }} disabled={busyFile === f.name} onClick={() => handleDownload(f.name)}>
              {busyFile === f.name ? 'Preparing…' : `Download ${f.name}`}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
