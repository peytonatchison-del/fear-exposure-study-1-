import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useResearcherAuth } from './ResearcherAuth.jsx';

export default function Login() {
  const navigate = useNavigate();
  const { setToken } = useResearcherAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { token } = await api.researcherLogin(username, password);
      setToken(token);
      navigate('/researcher/overview');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rd-login">
      <form className="card rd-login__card" onSubmit={handleSubmit}>
        <h1 className="screen-title">Researcher Dashboard</h1>
        <p className="lead">Log in to configure the study protocol and view collected data.</p>
        <div className="field-block">
          <label className="field-label" htmlFor="username">Username</label>
          <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div className="field-block">
          <label className="field-label" htmlFor="password">Password</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button className="btn btn-primary" type="submit" disabled={busy}>
          Log In
        </button>
      </form>
    </div>
  );
}
