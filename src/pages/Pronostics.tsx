import React from 'react';
import { ODDS_DATA } from '../data';
import Flag from '../components/Flag';

export default function Pronostics() {
  const odds = ODDS_DATA as any[];
  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>🎯 Pronostics & Cotes</h2>
      <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 8 }}>Probabilités de titre — Moyenne de 6 bookmakers : BetMGM · FanDuel · bet365 · DraftKings · Caesars · ESPN</p>
      <p style={{ fontSize: 11, color: 'var(--text3)', fontStyle: 'italic', marginBottom: 28 }}>À titre indicatif · Ne constitue pas un conseil de mise</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 12 }}>
        {odds.map((team: any, i: number) => (
          <div key={team.id} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, transition: 'border-color .2s, transform .2s, box-shadow .2s', position: 'relative', overflow: 'hidden' }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor='var(--border2)'; (e.currentTarget as HTMLDivElement).style.transform='translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow='0 8px 24px rgba(0,0,0,.4)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor='var(--border)'; (e.currentTarget as HTMLDivElement).style.transform='none'; (e.currentTarget as HTMLDivElement).style.boxShadow='none'; }}
          >
            {i < 3 && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${['#d4a843','#7878a0','#cd7f32'][i]},transparent)` }}/>}
            <span style={{ fontSize: 11, color: 'var(--text3)', minWidth: 20, fontFamily: 'DM Mono, monospace' }}>#{i+1}</span>
            <Flag code={team.flag} width={28} height={21} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{team.name}</div>
              <div style={{ height: 2, background: 'var(--bg4)', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(team.pct / (odds[0]?.pct || 1)) * 100}%`, background: 'linear-gradient(90deg,var(--gold),var(--gold2))', borderRadius: 2 }}/>
              </div>
              {team.src && <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{team.src}</div>}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--gold)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{team.pct}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}
