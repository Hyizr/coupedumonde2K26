import React, { useState } from 'react';
import { GROUPS, ODDS_DATA, getTeam } from '../data';
import Flag from '../components/Flag';

export default function Parcours() {
  const [teamId, setTeamId] = useState('');

  const allTeams = Object.entries(GROUPS as any).flatMap(([gk, g]: any) =>
    g.teams.map((t: any) => ({ ...t, grp: gk }))
  ).sort((a, b) => a.name.localeCompare(b.name, 'fr'));

  const team = teamId ? getTeam(teamId) : null;
  const grp = Object.entries(GROUPS as any).find(([, g]: any) => g.teams.find((t: any) => t.id === teamId))?.[0] || '';
  const groupTeams = grp ? (GROUPS as any)[grp].teams.filter((t: any) => t.id !== teamId) : [];

  const myStr = team?.str || 60;
  const avgOpp = groupTeams.reduce((s: number, t: any) => s + t.str, 0) / Math.max(groupTeams.length, 1);
  const qualProb = Math.round(Math.max(15, Math.min(95, 50 + (myStr - avgOpp) * 0.9)));
  const r16 = Math.round(qualProb * 0.75);
  const qf = Math.round(r16 * 0.65);
  const sf = Math.round(qf * 0.6);
  const fin = Math.round(sf * 0.55);
  const champ = Math.round(fin * 0.5);

  const stages = [
    { label: 'Qualification', prob: qualProb, color: 'var(--green)', icon: '🟢' },
    { label: '16es de Finale', prob: r16, color: 'var(--gold)', icon: '⚡' },
    { label: 'Quarts', prob: qf, color: 'var(--gold)', icon: '🏅' },
    { label: 'Demi-Finales', prob: sf, color: 'var(--yellow)', icon: '🔥' },
    { label: 'Finale', prob: fin, color: 'var(--accent2)', icon: '🏆' },
    { label: 'Champion', prob: champ, color: 'var(--gold2)', icon: '👑' },
  ];
  const odds = (ODDS_DATA as any[]).find(o => o.id === teamId);

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>🗺️ Parcours d'une Équipe</h2>
      <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 28 }}>Probabilités à chaque phase du tournoi basées sur les classements FIFA</p>

      <div style={{ marginBottom: 28 }}>
        <select value={teamId} onChange={e => setTeamId(e.target.value)} style={{
          padding: '11px 16px', borderRadius: 10, border: '1px solid var(--border2)',
          background: 'var(--bg2)', color: 'var(--text)', fontSize: 14,
          fontFamily: 'inherit', outline: 'none', cursor: 'pointer', minWidth: 220,
        }}>
          <option value="">-- Choisir une équipe --</option>
          {allTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {team && (
        <div style={{ animation: 'fadeIn .2s ease' }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '18px 22px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
            <Flag code={team.flag} width={48} height={36} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{team.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>Groupe {grp} · FIFA #{team.fifa} · Force {team.str}/100</div>
              {odds && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>📊 Bookmakers : {odds.pct}% de titre</div>}
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--gold)' }}>{champ}%</div>
              <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1 }}>Chance titre</div>
            </div>
          </div>

          <div style={{ marginBottom: 12, fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 700 }}>Probabilités par phase</div>
          {stages.map(s => (
            <div key={s.label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: '14px 18px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 14, transition: 'border-color .2s, transform .15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor='var(--border2)'; (e.currentTarget as HTMLDivElement).style.transform='translateX(4px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor='var(--border)'; (e.currentTarget as HTMLDivElement).style.transform='none'; }}
            >
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, color: 'var(--text3)', minWidth: 120 }}>{s.icon} {s.label}</span>
              <div style={{ flex: 1 }}>
                <div style={{ height: 4, background: 'var(--bg4)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${s.prob}%`, background: s.color, borderRadius: 2, transition: 'width .6s ease' }}/>
                </div>
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color, fontVariantNumeric: 'tabular-nums', minWidth: 50, textAlign: 'right' }}>{s.prob}%</div>
            </div>
          ))}

          <div style={{ marginTop: 24, marginBottom: 12, fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 700 }}>Adversaires en Groupe {grp}</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {groupTeams.map((opp: any) => {
              const winProb = Math.round(Math.max(15, Math.min(82, 50 + (myStr - opp.str) * 0.55)));
              return (
                <div key={opp.id} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '14px 18px', textAlign: 'center', flex: 1, minWidth: 140 }}>
                  <Flag code={opp.flag} width={28} height={21} style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{opp.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text2)' }}>FIFA #{opp.fifa}</div>
                  <div style={{ marginTop: 10, fontSize: 20, fontWeight: 800, color: 'var(--green)' }}>{winProb}%</div>
                  <div style={{ fontSize: 10, color: 'var(--text3)' }}>Victoire</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
