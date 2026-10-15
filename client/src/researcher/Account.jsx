import React, { useState } from 'react';
import { api } from '../api.js';

export default function Account() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setStatus('');
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    try {
      await api.changePassword(currentPassword, newPassword);
      setStatus('Password updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h1 className="screen-title">Account</h1>
      <form className="rd-card" onSubmit={handleSubmit} style={{ maxWidth: 420 }}>
        <div className="field-block">
          <label className="field-label">Current password</label>
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        </div>
        <div className="field-block">
          <label className="field-label">New password (min 8 characters)</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>
        <div className="field-block">
          <label className="field-label">Confirm new password</label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </div>
        {error && <p className="error-text">{error}</p>}
        {status && <p style={{ color: 'var(--calm-teal)' }}>{status}</p>}
        <button className="btn btn-primary" style={{ width: 'auto' }} type="submit">
          Update Password
        </button>
      </form>
    </div>
  );
}
