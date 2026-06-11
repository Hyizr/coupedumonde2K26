import React, { useMemo } from 'react';
import { GROUPS, SCHEDULE, matchProbs, fmtDate, getTeam } from '../data';
import Flag from '../components/Flag';
import ProbBar from '../components/ProbBar';
import { useApp } from '../context/AppContext';

function matchId(grp: string, t1: string, t2: string): string {
  const teams = (GROUPS as any)[grp].teams;
  const i1 = teams.findIndex((t: any) => t.id === t1);
  const i2 = teams.findIndex((t: any) => t.id === t2);
  if (i1 < i2) return `${grp}_${t1}_${t2}`;
  return `${grp}_${t2}_${t1}`;
}

function GroupCard({ gk, scores }: { gk: string; scores: Record<string, [number,number]> }) {
  const g = (GROUPS as any)[gk];
  const ts = g.teams;

  const standings = useMemo(() => {
    const st: Record<string, any> = {};
    ts.forEach((t: any) => { st[t.id] = { ...t, pts: 0, j: 0, bp: 0, bc: 0, diff: 0 }; });
    for (let i = 0; i < ts.length; i++) {
      for (let j = i + 1; j < ts.length; j++) {
        const mid = `${gk}_${ts[i].id}_${ts[j].id}`;
        const sc = scores[mid];
        if (!sc) continue;
        const [s1, s2] = sc;
        st[ts[i].id].j++; st[ts[j].id].j++;
        st[ts[i].id].bp += s1; st[ts[i].id].bc += s2;
        st[ts[j].id].bp += s2; st[ts[j].id].bc += s1;
        st[ts[i].id].diff += (s1-s2); st[ts[j].id].diff += (s2-s1);
        if (s1 > s2) { st[ts[i].id].pts += 3; }
        else if (s1 < s2) { st[ts[j].id].pts += 3; }
        else { st[ts[i].id].pts++; st[ts[j].id].pts++; }
      }
    }
    return Object.values(st).sort((a: any, b: any) => b.pts - a.pts || b.diff - a.diff || b.bp - a.bp);
  }, [gk, ts, scores]);

  const matches: any[] = [];
  for (let i = 0; i < ts.length; i++)
    for (let j = i + 1; j < ts.length; j++)
      matches.push([ts[i], ts[j]]);

  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', overflow: 'hidden', transition: 'border-color .25s, transform .25s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor='var(--border2)'; (e.currentTarget as HTMLDivElement).style.transform='translateY(-1px)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor='var(--border)'; (e.currentTarget as HTMLDivElement).style.transform='none'; }}
    >
      {/* Header */}
      <div style={{ background: 'linear-gradient(90deg,var(--bg3),var(--bg4))', padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--gold)', letterSpacing: .5, textTransform: 'uppercase' }}>Grp {gk}</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {ts.map((t: any) => <Flag key={t.id} code={t.flag} width={20} height={15} />)}
        </div>
      </div>

      {/* Standings */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ fontSize: 9, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1.3, padding: '7px 12px', textAlign: 'left', borderBottom: '1px solid var(--border)', fontWeight: 700 }}>Équipe</th>
            {['J','Pts','BP','Diff'].map(h => (
              <th key={h} style={{ fontSize: 9, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, padding: '7px 8px', textAlign: 'center', borderBottom: '1px solid var(--border)', fontWeight: 700, width: 28 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {standings.map((s: any, i: number) => (
            <tr key={s.id} style={{ background: i < 2 ? 'rgba(34,197,94,.035)' : 'transparent', borderBottom: '1px solid var(--border)', transition: 'background .12s' }}>
              <td style={{ padding: '9px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Flag code={s.flag} width={20} height={15} />
                  <span style={{ fontSize: 12.5, fontWeight: 500 }}>{s.name}</span>
                </div>
              </td>
              <td style={{ textAlign: 'center', fontSize: 12, color: 'var(--text2)', padding: '9px 8px' }}>{s.j}</td>
              <td style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, padding: '9px 8px' }}>{s.pts}</td>
              <td style={{ textAlign: 'center', fontSize: 12, color: 'var(--text2)', padding: '9px 8px' }}>{s.bp}</td>
              <td style={{ textAlign: 'center', fontSize: 12, color: s.diff > 0 ? 'var(--green)' : s.diff < 0 ? 'var(--red)' : 'var(--text2)', padding: '9px 8px' }}>{s.diff > 0 ? '+' : ''}{s.diff}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Matches */}
      <div style={{ borderTop: '1px solid var(--border)' }}>
        {matches.map(([t1, t2]) => {
          const mid = `${gk}_${t1.id}_${t2.id}`;
          const sc = scores[mid];
          const sch = (SCHEDULE as any[]).find(s => s.id === mid);
          const probs = matchProbs(t1.id, t2.id);
          return (
            <div key={mid} style={{ display: 'flex', alignItems: 'center', padding: '9px 12px', gap: 8, borderBottom: '1px solid var(--border)', transition: 'background .15s' }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background='rgba(255,255,255,.018)'}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background='transparent'}
            >
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden' }}>
                <Flag code={t1.flag} width={17} height={13} />
                <span style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t1.name}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, minWidth: 170 }}>
                <div style={{ fontSize: 10, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {sch && <span>{fmtDate(sch.date)} <b style={{ color: 'var(--text2)' }}>{sch.time}</b></span>}
                  {sch?.m6 && <span style={{ fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: 'rgba(0,120,255,.14)', color: '#6ab4ff', border: '1px solid rgba(0,120,255,.22)' }}>M6</span>}
                </div>
                {sc !== undefined ? (
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--gold2)', fontVariantNumeric: 'tabular-nums' }}>{sc[0]} – {sc[1]}</div>
                ) : (
                  <ProbBar w={probs.w} d={probs.d} l={probs.l} height={18} />
                )}
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden', flexDirection: 'row-reverse' }}>
                <Flag code={t2.flag} width={17} height={13} />
                <span style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t2.name}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Poules() {
  const { scores } = useApp();
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Poules & Scores</h2>
        <p style={{ fontSize: 13, color: 'var(--text2)' }}>Scores mis à jour automatiquement · Barres = probabilités de victoire</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(400px,1fr))', gap: 18 }}>
        {Object.keys(GROUPS).map(gk => <GroupCard key={gk} gk={gk} scores={scores} />)}
      </div>
    </div>
  );
}
