import React from 'react';
import { useApp } from '../context/AppContext';

const TABS = [
  { id: 'accueil', label: 'Accueil' },
  { id: 'poules', label: 'Poules & Scores' },
  { id: 'effectifs', label: 'Effectifs' },
  { id: 'pronostics', label: 'Pronostics' },
  { id: 'stats', label: 'Stats & Infos' },
  { id: 'confrontations', label: '📅 Confrontations' },
  { id: 'parcours', label: '🗺️ Parcours' },
];

export default function Nav() {
  const { activeTab, setActiveTab } = useApp();
  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(5,5,8,0.88)',
      backdropFilter: 'blur(24px) saturate(180%)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center',
      padding: '0 24px', height: 52, overflowX: 'auto',
      gap: 0,
    }}>
      <div style={{
        fontSize: 12, fontWeight: 800, color: 'var(--gold)',
        paddingRight: 20, borderRight: '1px solid var(--border)',
        marginRight: 6, letterSpacing: 2, flexShrink: 0,
        textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span>⚽</span> FIFA 2026
      </div>
      <div style={{ display: 'flex', gap: 0, overflowX: 'auto' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: '0 15px', height: 52, display: 'flex', alignItems: 'center',
            fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap',
            color: activeTab === tab.id ? 'var(--gold)' : 'var(--text2)',
            background: 'none', border: 'none', cursor: 'pointer',
            borderBottom: activeTab === tab.id ? '2px solid var(--gold)' : '2px solid transparent',
            transition: 'color .2s, border-color .2s', fontFamily: 'inherit',
          }}>
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
