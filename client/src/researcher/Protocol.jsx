import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

function slugify(s) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || `category_${Date.now()}`;
}

export default function Protocol() {
  const [categories, setCategories] = useState([]);
  const [questionnaireItems, setQuestionnaireItems] = useState([]);
  const [settings, setSettings] = useState(null);
  const [sessionMapText, setSessionMapText] = useState('{}');
  const [consentText, setConsentText] = useState('');
  const [status, setStatus] = useState({});
  const [error, setError] = useState({});

  useEffect(() => {
    api.getFullProtocol().then((p) => {
      setCategories(p.fearCategories);
      setQuestionnaireItems(p.questionnaireItems);
      setSettings(p.studySettings);
      setSessionMapText(JSON.stringify(p.studySettings.sessionLevelMap || {}, null, 2));
      setConsentText(p.studySettings.consentText || '');
    });
  }, []);

  function flash(section, msg, isError) {
    if (isError) setError((e) => ({ ...e, [section]: msg }));
    else {
      setError((e) => ({ ...e, [section]: '' }));
      setStatus((s) => ({ ...s, [section]: msg }));
      setTimeout(() => setStatus((s) => ({ ...s, [section]: '' })), 3000);
    }
  }

  // --- Categories -----------------------------------------------------
  function updateCategory(idx, patch) {
    setCategories((cats) => cats.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
  }
  function addCategory() {
    setCategories((cats) => [...cats, { id: `new_category_${cats.length + 1}`, name: 'New Category', description: '', active: true }]);
  }
  function removeCategory(idx) {
    setCategories((cats) => cats.filter((_, i) => i !== idx));
  }
  async function saveCategories() {
    try {
      await api.putCategories(categories);
      flash('categories', 'Saved.');
    } catch (err) {
      flash('categories', err.message, true);
    }
  }

  // --- Questionnaire ----------------------------------------------------
  function updateItem(idx, patch) {
    setQuestionnaireItems((items) => items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }
  function addItem() {
    setQuestionnaireItems((items) => [...items, { id: `q${items.length + 1}_${Date.now()}`, text: '', active: true }]);
  }
  function removeItem(idx) {
    setQuestionnaireItems((items) => items.filter((_, i) => i !== idx));
  }
  async function saveQuestionnaire() {
    try {
      await api.putQuestionnaire(questionnaireItems);
      flash('questionnaire', 'Saved.');
    } catch (err) {
      flash('questionnaire', err.message, true);
    }
  }

  // --- Study settings -----------------------------------------------------
  async function saveSettings() {
    try {
      let sessionLevelMap;
      try {
        sessionLevelMap = JSON.parse(sessionMapText);
      } catch {
        throw new Error('Session schedule must be valid JSON, e.g. {"1": [1], "2": [2]}');
      }
      const result = await api.putStudySettings({
        numSessions: settings.numSessions,
        daysBetweenSessions: settings.daysBetweenSessions,
        sessionSchedule: settings.sessionSchedule || {},
        finalAssessmentDate: settings.finalAssessmentDate || '',
        defaultExposureDurationSeconds: settings.defaultExposureDurationSeconds,
        sessionLevelMap,
      });
      setSettings(result.studySettings);
      flash('settings', 'Saved.');
    } catch (err) {
      flash('settings', err.message, true);
    }
  }

  // Each entry maps a session number (as a string key) to the ISO date
  // ("YYYY-MM-DD") on which that session unlocks for everyone. Session 1 has
  // no entry — it's available as soon as the baseline assessment is done.
  function updateScheduleDate(sessionNum, value) {
    setSettings((s) => ({
      ...s,
      sessionSchedule: { ...(s.sessionSchedule || {}), [String(sessionNum)]: value },
    }));
  }
  function clearScheduleDate(sessionNum) {
    setSettings((s) => {
      const next = { ...(s.sessionSchedule || {}) };
      delete next[String(sessionNum)];
      return { ...s, sessionSchedule: next };
    });
  }

  async function saveConsent() {
    try {
      const result = await api.putStudySettings({ consentText });
      setSettings(result.studySettings);
      flash('consent', 'Saved.');
    } catch (err) {
      flash('consent', err.message, true);
    }
  }

  if (!settings) return <p>Loading…</p>;

  return (
    <div>
      <h1 className="screen-title">Study Protocol</h1>
      <p className="lead">
        Everything here drives what participants actually see. Changes take effect immediately for anyone who
        hasn't loaded a screen yet.
      </p>

      <section className="rd-card">
        <h2 className="section-title" style={{ marginTop: 0 }}>Fear Categories</h2>
        {categories.map((cat, idx) => (
          <div key={idx} className="rd-row">
            <input
              type="text"
              value={cat.name}
              onChange={(e) => updateCategory(idx, { name: e.target.value, id: cat.id.startsWith('new_category') ? slugify(e.target.value) : cat.id })}
              placeholder="Category name"
              style={{ flex: '1 1 160px' }}
            />
            <input
              type="text"
              value={cat.description || ''}
              onChange={(e) => updateCategory(idx, { description: e.target.value })}
              placeholder="Short description"
              style={{ flex: '2 1 220px' }}
            />
            <label className="rd-inline-check">
              <input type="checkbox" checked={cat.active} onChange={(e) => updateCategory(idx, { active: e.target.checked })} />
              Active
            </label>
            <button className="btn btn-danger" style={{ width: 'auto' }} onClick={() => removeCategory(idx)}>
              Remove
            </button>
          </div>
        ))}
        <div className="rd-row">
          <button className="btn btn-secondary" style={{ width: 'auto' }} onClick={addCategory}>
            + Add Category
          </button>
          <button className="btn btn-primary" style={{ width: 'auto' }} onClick={saveCategories}>
            Save Categories
          </button>
        </div>
        {error.categories && <p className="error-text">{error.categories}</p>}
        {status.categories && <p style={{ color: 'var(--calm-teal)' }}>{status.categories}</p>}
      </section>

      <section className="rd-card">
        <h2 className="section-title" style={{ marginTop: 0 }}>GAD-7 Questionnaire (baseline &amp; final only)</h2>
        <p className="lead" style={{ fontSize: '0.9rem' }}>
          These are the 7 GAD-7 items, shown only at the baseline and final assessments (never per-session) so
          scores can be compared pre/post. Editing the wording below deviates from the validated instrument, so
          only change it if you have a specific, approved reason to. Each item is adapted to name the participant&rsquo;s
          chosen fear category — wherever <code>{'{topic}'}</code> appears below, it&rsquo;s automatically replaced
          with that category&rsquo;s topic (e.g. &ldquo;public speaking&rdquo;) when shown to the participant.
        </p>
        {questionnaireItems.map((item, idx) => (
          <div key={idx} className="rd-row">
            <input
              type="text"
              value={item.text}
              onChange={(e) => updateItem(idx, { text: e.target.value })}
              placeholder="Question text"
              style={{ flex: '3 1 260px' }}
            />
            <label className="rd-inline-check">
              <input type="checkbox" checked={item.active} onChange={(e) => updateItem(idx, { active: e.target.checked })} />
              Active
            </label>
            <button className="btn btn-danger" style={{ width: 'auto' }} onClick={() => removeItem(idx)}>
              Remove
            </button>
          </div>
        ))}
        <div className="rd-row">
          <button className="btn btn-secondary" style={{ width: 'auto' }} onClick={addItem}>
            + Add Item
          </button>
          <button className="btn btn-primary" style={{ width: 'auto' }} onClick={saveQuestionnaire}>
            Save Questionnaire
          </button>
        </div>
        {error.questionnaire && <p className="error-text">{error.questionnaire}</p>}
        {status.questionnaire && <p style={{ color: 'var(--calm-teal)' }}>{status.questionnaire}</p>}
      </section>

      <section className="rd-card">
        <h2 className="section-title" style={{ marginTop: 0 }}>Session Schedule &amp; Timing</h2>
        <div className="rd-grid-2">
          <div className="field-block">
            <label className="field-label">Number of sessions</label>
            <input
              type="text"
              value={settings.numSessions}
              onChange={(e) => setSettings((s) => ({ ...s, numSessions: e.target.value }))}
            />
          </div>
          <div className="field-block">
            <label className="field-label">Default exposure duration (seconds)</label>
            <input
              type="text"
              value={settings.defaultExposureDurationSeconds}
              onChange={(e) => setSettings((s) => ({ ...s, defaultExposureDurationSeconds: e.target.value }))}
            />
          </div>
        </div>
        <div className="field-block">
          <label className="field-label">Session availability dates</label>
          <p className="lead" style={{ fontSize: '0.85rem', marginTop: 0 }}>
            Set the calendar date each session unlocks for every participant (instead of counting days since their
            last session). Leave a session blank to fall back to a fixed number of days after the previous session
            instead.
          </p>
          {Array.from({ length: Math.max(0, (Number(settings.numSessions) || 1) - 1) }, (_, i) => i + 2).map(
            (sessionNum) => (
              <div key={sessionNum} className="rd-row">
                <label style={{ flex: '1 1 140px' }}>Session {sessionNum} unlocks on</label>
                <input
                  type="date"
                  value={(settings.sessionSchedule && settings.sessionSchedule[String(sessionNum)]) || ''}
                  onChange={(e) => updateScheduleDate(sessionNum, e.target.value)}
                  style={{ flex: '1 1 180px' }}
                />
                {settings.sessionSchedule && settings.sessionSchedule[String(sessionNum)] && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ width: 'auto' }}
                    onClick={() => clearScheduleDate(sessionNum)}
                  >
                    Clear
                  </button>
                )}
              </div>
            )
          )}
          <label className="field-label" style={{ marginTop: 14 }}>
            Fallback: days after previous session (used only for sessions with no date set above)
          </label>
          <input
            type="text"
            value={settings.daysBetweenSessions}
            onChange={(e) => setSettings((s) => ({ ...s, daysBetweenSessions: e.target.value }))}
            style={{ maxWidth: 160 }}
          />
        </div>
        <div className="field-block">
          <label className="field-label">Final assessment (GAD-7 wrap-up) date</label>
          <p className="lead" style={{ fontSize: '0.85rem', marginTop: 0 }}>
            Set this so the final assessment opens on its own date, separate from whatever date the last session
            (Session {Math.max(1, Number(settings.numSessions) || 1)}) unlocks on. Leave it blank to have the final
            assessment open immediately once the last session is completed.
          </p>
          <div className="rd-row">
            <input
              type="date"
              value={settings.finalAssessmentDate || ''}
              onChange={(e) => setSettings((s) => ({ ...s, finalAssessmentDate: e.target.value }))}
              style={{ flex: '1 1 180px' }}
            />
            {settings.finalAssessmentDate && (
              <button
                type="button"
                className="btn btn-secondary"
                style={{ width: 'auto' }}
                onClick={() => setSettings((s) => ({ ...s, finalAssessmentDate: '' }))}
              >
                Clear
              </button>
            )}
          </div>
        </div>
        <div className="field-block">
          <label className="field-label">
            Which exposure level(s) appear in each session number (JSON: session number → array of levels 1-5)
          </label>
          <textarea
            value={sessionMapText}
            onChange={(e) => setSessionMapText(e.target.value)}
            style={{ fontFamily: 'monospace', minHeight: 140 }}
          />
        </div>
        <button className="btn btn-primary" style={{ width: 'auto' }} onClick={saveSettings}>
          Save Session Settings
        </button>
        {error.settings && <p className="error-text">{error.settings}</p>}
        {status.settings && <p style={{ color: 'var(--calm-teal)' }}>{status.settings}</p>}
      </section>

      <section className="rd-card">
        <h2 className="section-title" style={{ marginTop: 0 }}>Study Information / Consent Text</h2>
        <p className="lead" style={{ fontSize: '0.9rem' }}>
          Shown on the Welcome, Research Information, and Consent screens. Replace with the IRB-approved wording.
        </p>
        <textarea value={consentText} onChange={(e) => setConsentText(e.target.value)} style={{ minHeight: 220 }} />
        <div style={{ marginTop: 12 }}>
          <button className="btn btn-primary" style={{ width: 'auto' }} onClick={saveConsent}>
            Save Consent Text
          </button>
        </div>
        {error.consent && <p className="error-text">{error.consent}</p>}
        {status.consent && <p style={{ color: 'var(--calm-teal)' }}>{status.consent}</p>}
      </section>
    </div>
  );
}
