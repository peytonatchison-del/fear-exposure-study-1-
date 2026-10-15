import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';

const StudyContext = createContext(null);

const STORAGE_KEY = 'fearStudy.participant';

function loadStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function StudyProvider({ children }) {
  const [protocol, setProtocol] = useState(null);
  const [protocolError, setProtocolError] = useState(null);
  const [participant, setParticipantState] = useState(loadStored());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .getProtocol()
      .then((p) => !cancelled && setProtocol(p))
      .catch((err) => !cancelled && setProtocolError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const setParticipant = useCallback((p) => {
    setParticipantState(p);
    if (p) localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    else localStorage.removeItem(STORAGE_KEY);
  }, []);

  const refreshParticipant = useCallback(
    async (code) => {
      const p = await api.getParticipant(code);
      setParticipant(p);
      return p;
    },
    [setParticipant]
  );

  const clearParticipant = useCallback(() => setParticipant(null), [setParticipant]);

  const categoryName = useMemo(() => {
    if (!protocol || !participant?.fearCategoryId) return '';
    return protocol.categories.find((c) => c.id === participant.fearCategoryId)?.name || '';
  }, [protocol, participant]);

  const value = {
    protocol,
    protocolError,
    loading,
    participant,
    setParticipant,
    refreshParticipant,
    clearParticipant,
    categoryName,
  };

  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>;
}

export function useStudy() {
  const ctx = useContext(StudyContext);
  if (!ctx) throw new Error('useStudy must be used inside a StudyProvider');
  return ctx;
}
