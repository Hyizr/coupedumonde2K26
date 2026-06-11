import React from 'react';
import { GROUPS } from '../data';

const statCards = [
  { v: '48', l: 'Nations qualifiées', d: 'Record absolu pour une Coupe du Monde' },
  { v: '104', l: 'Matchs joués', d: 'Phase de groupes + 32 matches KO' },
  { v: '16', l: 'Stades utilisés', d: 'Répartis entre USA, Canada et Mexique' },
  { v: '12', l: 'Groupes de 4', d: 'Groupes A à L' },
  { v: '3', l: 'Pays hôtes', d: 'États-Unis, Canada, Mexique' },
  { v: '5,994 km', l: 'Écart max entre stades', d: 'Vancouver ↔ Miami' },
];

const stadiums = [
  { name: 'MetLife Stadium', city: 'New York', capacity: '82,500', country: 'usa' },
  { name: 'Rose Bowl', city: 'Los Angeles', capacity: '90,888', country: 'usa' },
  { name: 'Azteca', city: 'Mexico City', capacity: '87,523', country: 'mex' },
  { name: 'AT&T Stadium', city: 'Dallas', capacity: '80,000', country: 'usa' },
  { name: 'SoFi Stadium', city: 'Los Angeles', capacity: '70,240', country: 'usa' },
  { name: 'Hard Rock', city: 'Miami', capacity: '65,326', country: 'usa' },
  { name: 'Lincoln Financial', city: 'Philadelphia', capacity: '69,176', country: 'usa' },
  { name: 'Lumen Field', city: 'Seattle', capacity: '68,740', country: 'usa' },
  { name: 'BC Place', city: 'Vancouver', capacity: '54,500', country: 'can' },
  { name: 'BMO Field', city: 'Toronto', capacity: '45,736', country: 'can' },
  { name: 'Gillette Stadium', city: 'Boston', capacity: '65,878', country: 'usa' },
  { name: 'Arrowhead', city: 'Kansas City', capacity: '76,416', country: 'usa' },
  { name: 'Estadio BBVA', city: 'Monterrey', capacity: '53,500', country: 'mex' },
  { name: 'Estadio Akron', city: 'Guadalajara', capacity: '45,161', country: 'mex' },
  { name: 'NRG Stadium', city: 'Houston', capacity: '72,220', country: 'usa' },
  { name: 'Mercedes-Benz', city: 'Atlanta', capacity: '75,000', country: 'usa' },
];

export default function Stats() {
  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>📊 Stats & Infos</h2>
      <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 28 }}>Tout ce qu'il faut savoir sur la Coupe du Monde 2026</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14, marginBottom: 40 }}>
        {statCards.map(s => (
          <div key={s.v} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '18px 20px', position: 'relative', overflow: 'hidden', transition: 'border-color .25s, transform .2s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor='var(--border2)'; (e.currentTarget as HTMLDivElement).style.transform='translateY(-1px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor='var(--border)'; (e.currentTarget as HTMLDivElement).style.transform='none'; }}
          >
            <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, background: 'radial-gradient(circle at top right, rgba(212,168,67,.06) 0%, transparent 70%)', pointerEvents: 'none' }}/>
            <div style={{ fontSize: 10, color: 'var(--text2)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1.6, fontWeight: 600 }}>{s.l}</div>
            <div style={{ fontSize: 32, fontWeight: 800, background: 'linear-gradient(135deg,var(--gold),var(--gold2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>{s.v}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 8 }}>{s.d}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 12, fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700 }}>🏟️ Stades</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 10 }}>
        {stadiums.map(s => (
          <div key={s.name} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{s.city}</div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'DM Mono, monospace' }}>{s.capacity}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
