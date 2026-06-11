import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Nav from './components/Nav';
import Accueil from './pages/Accueil';
import Poules from './pages/Poules';
import Effectifs from './pages/Effectifs';
import Pronostics from './pages/Pronostics';
import Stats from './pages/Stats';
import Confrontations from './pages/Confrontations';
import Parcours from './pages/Parcours';

function AppContent() {
  const { activeTab } = useApp();
  const pages: Record<string, React.ReactNode> = {
    accueil: <Accueil />,
    poules: <Poules />,
    effectifs: <Effectifs />,
    pronostics: <Pronostics />,
    stats: <Stats />,
    confrontations: <Confrontations />,
    parcours: <Parcours />,
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', position: 'relative' }}>
      {/* Ambient background */}
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse 80% 50% at 20% 0%, rgba(91,127,255,.04) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(212,168,67,.03) 0%, transparent 60%)', pointerEvents: 'none', zIndex: 0 }}/>
      <Nav />
      <main style={{ maxWidth: 1440, margin: '0 auto', padding: '36px 24px 100px', position: 'relative', zIndex: 1, animation: 'fadeIn .2s ease' }}>
        {pages[activeTab] || <Accueil />}
      </main>
      <footer style={{ textAlign: 'center', padding: 24, fontSize: 10.5, color: 'var(--text3)', borderTop: '1px solid var(--border)', marginTop: 60 }}>
        FIFA 2026 Hub · Données officielles · football-data.org · api-football.com
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
