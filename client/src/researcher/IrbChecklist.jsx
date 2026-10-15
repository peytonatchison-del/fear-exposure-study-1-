import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

const CHECKLIST_ITEMS = [
  { key: 'protocolApprovedByIrb', label: 'The full study protocol (design, procedures, number of sessions, schedule) has received IRB approval.' },
  { key: 'consentAssentApprovedByIrb', label: 'The information/consent (and, if applicable, parental consent + minor assent) language configured on the Consent screen exactly matches what the IRB approved.' },
  { key: 'exposureMaterialsApprovedByIrb', label: 'Every exposure stimulus configured in the Stimuli tab is the exact, IRB-approved material for that category and level — no placeholders remain.' },
  { key: 'appConfigurationMatchesApprovedProtocol', label: 'The session schedule, exposure durations, and questionnaire items configured in the Protocol tab match the approved protocol.' },
  { key: 'emergencyProcedureReviewed', label: 'The Help/Emergency screen content has been reviewed and is appropriate for this participant population.' },
];

export default function IrbChecklist() {
  const [settings, setSettings] = useState(null);
  const [checklist, setChecklist] = useState({});
  const [protocolNumber, setProtocolNumber] = useState('');
  const [approvalDate, setApprovalDate] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.getFullProtocol().then((p) => {
      setSettings(p.studySettings);
      setChecklist(p.studySettings.irbChecklist || {});
      setProtocolNumber(p.studySettings.irbProtocolNumber || '');
      setApprovalDate(p.studySettings.irbApprovalDate || '');
    });
  }, []);

  async function handleSave() {
    setError('');
    setStatus('');
    try {
      const result = await api.putIrbChecklist({ checklist, irbProtocolNumber: protocolNumber, irbApprovalDate: approvalDate });
      setSettings(result.studySettings);
      setStatus(result.studySettings.irbApproved ? 'All items confirmed — real data collection is now enabled.' : 'Saved. Real data collection stays blocked until every item is checked.');
    } catch (err) {
      setError(err.message);
    }
  }

  if (!settings) return <p>Loading…</p>;

  return (
    <div>
      <h1 className="screen-title">IRB Configuration Checklist</h1>
      <p className="lead">
        Before this application collects data from real participants, confirm every item below. Real-participant
        registration stays technically blocked on the server until they are all checked and saved.
      </p>

      <div className={settings.irbApproved ? 'disclaimer-banner' : 'warning-banner'}>
        {settings.irbApproved
          ? 'Status: IRB checklist complete. Real-participant data collection is enabled (server must also be running with APP_MODE=real).'
          : 'Status: Real-participant data collection is BLOCKED until this checklist is complete.'}
      </div>

      <div className="rd-card">
        {CHECKLIST_ITEMS.map((item) => (
          <label key={item.key} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 16 }}>
            <input
              type="checkbox"
              checked={!!checklist[item.key]}
              onChange={(e) => setChecklist((c) => ({ ...c, [item.key]: e.target.checked }))}
              style={{ marginTop: 4, width: 20, height: 20 }}
            />
            <span>{item.label}</span>
          </label>
        ))}

        <div className="field-block">
          <label className="field-label" htmlFor="protocol-number">IRB Protocol Number</label>
          <input id="protocol-number" type="text" value={protocolNumber} onChange={(e) => setProtocolNumber(e.target.value)} />
        </div>
        <div className="field-block">
          <label className="field-label" htmlFor="approval-date">IRB Approval Date</label>
          <input id="approval-date" type="text" placeholder="YYYY-MM-DD" value={approvalDate} onChange={(e) => setApprovalDate(e.target.value)} />
        </div>

        {error && <p className="error-text">{error}</p>}
        {status && <p style={{ color: 'var(--calm-teal)', fontWeight: 600 }}>{status}</p>}

        <button className="btn btn-primary" style={{ width: 'auto' }} onClick={handleSave}>
          Save Checklist
        </button>
      </div>
    </div>
  );
}
