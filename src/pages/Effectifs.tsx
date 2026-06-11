import React, { useState } from 'react';
import { GROUPS, SQ } from '../data';
import Flag from '../components/Flag';

export default function Effectifs() {
  const [open, setOpen] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const allTeams = Object.entries(GROUPS as any).flatMap(([, g]: any) => g.teams);
  const filtered = allTeams.filter((t: any) => t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Effectifs</h2>
      <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20 }}>48 sélections nationales · Cliquez pour voir le groupe complet</p>
      <input placeholder="Rechercher une équipe..." value={search} onChange={e => setSearch(e.target.value)}
        style={{ width: '100%', padding: '11px 16px', borderRadius: 'var(--r)', border: '1px solid var(--border2)', background: 'var(--bg2)', color: 'var(--text)', fontSize: 14, fontFamily: 'inherit', outline: 'none', marginBottom: 20, transition: 'border-color .2s, box-shadow .2s' }}
        onFocus={e => { e.currentTarget.style.borderColor='rgba(212,168,67,.5)'; e.currentTarget.style.boxShadow='0 0 0 3px rgba(212,168,67,.12)'; }}
        onBlur={e => { e.currentTarget.style.borderColor='var(--border2)'; e.currentTarget.style.boxShadow='none'; }}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 14 }}>
        {filtered.map((team: any) => {
          const sq = (SQ as any)[team.id];
          const isOpen = open === team.id;
          const posColor: Record<string,string> = { GK: '#f59e0b', DEF: '#5b7fff', MID: '#22c55e', ATT: '#ef4444' };
          return (
            <div key={team.id} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', overflow: 'hidden', transition: 'border-color .25s' }}
              onMouseEnter={e => !isOpen && ((e.currentTarget as HTMLDivElement).style.borderColor='var(--border2)')}
              onMouseLeave={e => !isOpen && ((e.currentTarget as HTMLDivElement).style.borderColor='var(--border)')}
            >
              <div onClick={() => setOpen(isOpen ? null : team.id)}
                style={{ background: 'linear-gradient(90deg,var(--bg3),var(--bg4))', padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', transition: 'background .2s', userSelect: 'none' }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background='linear-gradient(90deg,var(--bg4),var(--bg5))'}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background='linear-gradient(90deg,var(--bg3),var(--bg4))'}
              >
                <Flag code={team.flag} width={32} height={24} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{team.name}</div>
                  {sq && <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{sq.coach}</div>}
                </div>
                <span style={{ fontSize: 14, color: 'var(--text3)', transition: 'transform .25s', transform: isOpen ? 'rotate(180deg)' : 'none', display: 'block' }}>▼</span>
              </div>
              {isOpen && sq && (
                <div>
                  {sq.players.map((p: any) => (
                    <div key={p.n} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', borderTop: '1px solid var(--border)', transition: 'background .12s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background='rgba(255,255,255,.018)'}
                      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background='transparent'}
                    >
                      <span style={{ fontSize: 10, color: 'var(--text3)', minWidth: 22, textAlign: 'right', fontFamily: 'DM Mono, monospace' }}>{p.n}</span>
                      <span style={{ fontSize: 9.5, fontWeight: 700, minWidth: 28, textTransform: 'uppercase', letterSpacing: .5, color: posColor[p.pos] || 'var(--text2)' }}>{p.pos}</span>
                      <span style={{ flex: 1, fontSize: 12.5, fontWeight: 500 }}>{p.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--text3)' }}>{p.club}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
