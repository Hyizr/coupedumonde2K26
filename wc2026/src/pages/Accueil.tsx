import React from 'react';
import { ODDS_DATA } from '../data';
import Flag from '../components/Flag';
import { useApp } from '../context/AppContext';

const stats = [
  { n: '48', l: 'Équipes' },
  { n: '12', l: 'Groupes' },
  { n: '104', l: 'Matchs' },
  { n: '3', l: 'Pays hôtes' },
];

export default function Accueil() {
  const top8 = (ODDS_DATA as any[]).slice(0, 8);
  return (
    <div>
      {/* Hero */}
      <div style={{
        textAlign: 'center', padding: '80px 24px 64px',
        background: 'radial-gradient(ellipse 70% 60% at 50% -10%, rgba(212,168,67,.09) 0%, transparent 65%)',
        borderRadius: 20, marginBottom: 48,
        border: '1px solid var(--border)', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', bottom: -60, right: -20,
          fontSize: 260, fontWeight: 900, color: 'rgba(255,255,255,.015)',
          letterSpacing: -20, pointerEvents: 'none', lineHeight: 1,
        }}>2026</div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          background: 'rgba(212,168,67,.1)', border: '1px solid rgba(212,168,67,.22)',
          borderRadius: 999, padding: '5px 16px', fontSize: 10.5,
          fontWeight: 600, color: 'var(--gold)', letterSpacing: 1,
          textTransform: 'uppercase', marginBottom: 24,
        }}>
          🏆 11 Juin — 19 Juillet 2026
        </div>
        <h1 style={{
          fontSize: 52, fontWeight: 800, letterSpacing: -2.5, lineHeight: 1.05,
          marginBottom: 14,
        }}>
          Coupe du Monde<br/>
          <span style={{
            background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold2) 40%, var(--gold3) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>FIFA 2026</span>
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text2)', letterSpacing: .4 }}>
          États-Unis · Canada · Mexique · 48 équipes · 104 matchs
        </p>
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 0,
          marginTop: 52, borderTop: '1px solid var(--border)', paddingTop: 36, flexWrap: 'wrap',
        }}>
          {stats.map(s => (
            <div key={s.n} style={{
              textAlign: 'center', padding: '0 36px',
              borderRight: '1px solid var(--border)',
            }}>
              <div style={{
                fontSize: 36, fontWeight: 800, lineHeight: 1,
                background: 'linear-gradient(135deg,var(--gold),var(--gold2))',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>{s.n}</div>
              <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 7, textTransform: 'uppercase', letterSpacing: 1.8, fontWeight: 600 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Favorites */}
      <div style={{ marginBottom: 16, fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700 }}>
        🏆 Favoris au titre
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12 }}>
        {top8.map((team: any, i: number) => (
          <div key={team.id} style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 'var(--r)', padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: 12,
            transition: 'border-color .2s, transform .2s',
            cursor: 'default',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor='var(--border2)'; (e.currentTarget as HTMLDivElement).style.transform='translateY(-2px)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor='var(--border)'; (e.currentTarget as HTMLDivElement).style.transform='none'; }}
          >
            <span style={{ fontSize: 11, color: 'var(--text3)', minWidth: 18, fontFamily: 'DM Mono, monospace' }}>#{i+1}</span>
            <Flag code={team.flag} width={28} height={21} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{team.name}</div>
              <div style={{ height: 2, background: 'var(--bg4)', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${team.pct}%`, background: 'linear-gradient(90deg,var(--gold),var(--gold2))', borderRadius: 2 }} />
              </div>
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--gold)', fontFamily: 'DM Mono, monospace' }}>{team.pct}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}
