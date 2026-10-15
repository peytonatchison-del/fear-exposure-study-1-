import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api.js';

const ResearcherAuthContext = createContext(null);

export function ResearcherAuthProvider({ children }) {
  const [token, setTokenState] = useState(() => localStorage.getItem('researcherToken'));
  const [username, setUsername] = useState(null);
  const [displayName, setDisplayName] = useState(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!token) {
      setChecked(true);
      return;
    }
    api
      .researcherMe()
      .then((r) => {
        setUsername(r.username);
        setDisplayName(r.displayName);
      })
      .catch(() => {
        localStorage.removeItem('researcherToken');
        setTokenState(null);
      })
      .finally(() => setChecked(true));
  }, [token]);

  function setToken(t) {
    if (t) localStorage.setItem('researcherToken', t);
    else localStorage.removeItem('researcherToken');
    setTokenState(t);
  }

  function logout() {
    setToken(null);
    setUsername(null);
    setDisplayName(null);
  }

  return (
    <ResearcherAuthContext.Provider value={{ token, username, displayName, setToken, logout, checked }}>
      {children}
    </ResearcherAuthContext.Provider>
  );
}

export function useResearcherAuth() {
  const ctx = useContext(ResearcherAuthContext);
  if (!ctx) throw new Error('useResearcherAuth must be used inside ResearcherAuthProvider');
  return ctx;
}
