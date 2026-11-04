import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { formatTimestamp } from '../utils/formatTimestamp.js';

// Lets the researcher review and act on participants' "please give me more
// time" requests, filed from the participant-facing Session Window Closed
// screen when a rolling-timing session's window has closed on them. Only
// relevant when Protocol → Session Schedule & Timing is set to "Rolling
// window after each session," but this list works the same either way —
// there's just nothing in it under calendar-date timing, since that screen
// is never reached in that mode.
export default function ExtensionRequests() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  // One pending "days to grant" input value per request id, keyed by id, so
  // each row's draft number is independent of the others.
  const [grantDraft, setGrantDraft] = useState({});

  function load() {
    api.getAllExtensionRequests().then(setRows).catch((err) => setError(err.message));
  }

  useEffect(load, []);

  async function handleApprove(id) {
    const days = Number(grantDraft[id]);
    if (!Number.isFinite(days) || days <= 0) {
      setError('Enter how many days to grant before approving.');
      return;
    }
    setBusyId(id);
    setError('');
    try {
      await api.decideExtensionRequest(id, 'approved', days);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDeny(id) {
    if (!window.confirm('Deny this request? The participant will see that it was not approved.')) return;
    setBusyId(id);
    setError('');
    try {
      await api.decideExtensionRequest(id, 'denied');
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  const pending = rows.filter((r) => r.status === 'pending');
  const decided = rows.filter((r) => r.status !== 'pending');

  return (
    <div>
      <h1 className="screen-title">Extension Requests</h1>
      <p className="lead">
        When a participant misses a session&rsquo;s rolling-timing window, they can ask here for more time. Approving
        a request adds the number of days you choose on top of that session&rsquo;s normal window, just for that one
        participant &mdash; it never changes anyone else&rsquo;s timing or your default settings on the Protocol page.
      </p>

      {error && <p className="error-text">{error}</p>}

      <section className="rd-card">
        <h2 className="section-title" style={{ marginTop: 0 }}>
          Pending ({pending.length})
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table className="rd-table">
            <thead>
              <tr>
                <th>Study Code</th>
                <th>Session</th>
                <th>Note</th>
                <th>Requested</th>
                <th>Grant how many days?</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pending.map((r) => (
                <tr key={r.id}>
                  <td>
                    {r.studyCode} {r.isDemo && <span style={{ color: 'var(--text-muted)' }}>(demo)</span>}
                  </td>
                  <td>{r.sessionLabel === 'final' ? 'Final Assessment' : `Session ${r.sessionLabel}`}</td>
                  <td style={{ maxWidth: 240, whiteSpace: 'pre-wrap' }}>{r.note || '—'}</td>
                  <td>{formatTimestamp(r.requestedAt)}</td>
                  <td>
                    <input
                      type="text"
                      value={grantDraft[r.id] ?? ''}
                      onChange={(e) => setGrantDraft((d) => ({ ...d, [r.id]: e.target.value }))}
                      placeholder="e.g. 2"
                      style={{ width: 70 }}
                    />
                  </td>
                  <td style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn btn-primary"
                      style={{ width: 'auto' }}
                      disabled={busyId === r.id}
                      onClick={() => handleApprove(r.id)}
                    >
                      Approve
                    </button>
                    <button
                      className="btn btn-danger"
                      style={{ width: 'auto' }}
                      disabled={busyId === r.id}
                      onClick={() => handleDeny(r.id)}
                    >
                      Deny
                    </button>
                  </td>
                </tr>
              ))}
              {pending.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>
                    No pending requests.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rd-card">
        <h2 className="section-title" style={{ marginTop: 0 }}>
          Decided
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table className="rd-table">
            <thead>
              <tr>
                <th>Study Code</th>
                <th>Session</th>
                <th>Note</th>
                <th>Requested</th>
                <th>Decision</th>
                <th>Decided</th>
              </tr>
            </thead>
            <tbody>
              {decided.map((r) => (
                <tr key={r.id}>
                  <td>
                    {r.studyCode} {r.isDemo && <span style={{ color: 'var(--text-muted)' }}>(demo)</span>}
                  </td>
                  <td>{r.sessionLabel === 'final' ? 'Final Assessment' : `Session ${r.sessionLabel}`}</td>
                  <td style={{ maxWidth: 240, whiteSpace: 'pre-wrap' }}>{r.note || '—'}</td>
                  <td>{formatTimestamp(r.requestedAt)}</td>
                  <td>
                    {r.status === 'approved' ? (
                      <span style={{ color: 'var(--calm-teal)' }}>
                        Approved &mdash; +{(r.grantedHours / 24).toFixed(r.grantedHours % 24 === 0 ? 0 : 1)} day
                        {r.grantedHours === 24 ? '' : 's'}
                      </span>
                    ) : (
                      <span className="error-text">Denied</span>
                    )}
                  </td>
                  <td>{formatTimestamp(r.decidedAt)}</td>
                </tr>
              ))}
              {decided.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>
                    No decided requests yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
