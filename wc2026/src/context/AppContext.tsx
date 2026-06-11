import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchAllLive, scoresCache } from '../lib/api';

interface AppCtx {
  scores: Record<string, [number, number]>;
  liveData: Record<string, any>;
  activeTab: string;
  setActiveTab: (t: string) => void;
  refreshScores: () => Promise<void>;
}

const Ctx = createContext<AppCtx>({} as AppCtx);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [scores, setScores] = useState<Record<string, [number, number]>>({});
  const [liveData] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState('accueil');

  const refreshScores = useCallback(async () => {
    await fetchAllLive();
    setScores({ ...scoresCache });
  }, []);

  useEffect(() => {
    refreshScores();
    const interval = setInterval(refreshScores, 60000);
    return () => clearInterval(interval);
  }, [refreshScores]);

  return (
    <Ctx.Provider value={{ scores, liveData, activeTab, setActiveTab, refreshScores }}>
      {children}
    </Ctx.Provider>
  );
}

export const useApp = () => useContext(Ctx);
