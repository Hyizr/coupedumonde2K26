import React, { useState } from 'react';
import { SCHEDULE, KO_SCHEDULE, fmtDate, isToday, getTeam, matchProbs } from '../data';
import Flag from '../components/Flag';
import ProbBar from '../components/ProbBar';
import { useApp } from '../context/AppContext';
import MatchModal from '../components/MatchModal';

type Filter = 'all' | 'm6' | 'fra' | 'pending' | 'done';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Tous' },
  { id: 'm6', label: '📺 M6 gratuit' },
  { id: 'fra', label: '🇫🇷 Bleus' },
  { id: 'pending', label: '⏳ À jouer' },
  { id: 'done', label: '✅ Joués' },
];

function TVBadge({ m6 }: { m6: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      <span style={{ fontSize: 8.5, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: 'rgba(255,140,0,.14)', color: '#ffb347', border: '1px solid rgba(255,140,0,.22)' }}>beIN</span>
      {m6 && <span style={{ fontSize: 8.5, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: 'rgba(0,120,255,.14)', color: '#6ab4ff', border: '1px solid rgba(0,120,255,.22)' }}>M6</span>}
    </div>
  );
}

export default function Confrontations() {
  const [filter, setFilter] = useState<Filter>('all');
  const [modalId, setModalId] = useState<string | null>(null);
  const { scores } = useApp();

  const filtered = (SCHEDULE as any[]).filter(m => {
    const sc = scores[m.id];
    const isFra = m.t1 === 'fra' || m.t2 === 'fra';
    const isDone = sc !== undefined;
    if (filter === 'm6' && !m.m6) return false;
    if (filter === 'fra' && !isFra) return false;
    if (filter === 'pending' && isDone) return false;
    if (filter === 'done' && !isDone) return false;
    return true;
  });

  const byDate: Record<string, any[]> = {};
  filtered.forEach(m => {
    if (!byDate[m.date]) byDate[m.date] = [];
    byDate[m.date].push(m);
  });
  const dates = Object.keys(byDate).sort();

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>📅 Confrontations</h2>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20 }}>Cliquez sur un match pour voir les stats, compositions et résumé détaillé</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{
              padding: '7px 15px', borderRadius: 999,
              border: `1px solid ${filter === f.id ? 'var(--gold)' : 'var(--border2)'}`,
              background: filter === f.id ? 'var(--gold-dim)' : 'transparent',
              color: filter === f.id ? 'var(--gold)' : 'var(--text2)',
              fontSize: 12, fontWeight: 500, cursor: 'pointer',
              transition: 'all .2s', fontFamily: 'inherit',
            }}>{f.label}</button>
          ))}
        </div>
      </div>

      {dates.map(date => (
        <div key={date}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: isToday(date) ? 'var(--gold)' : 'var(--text3)',
            textTransform: 'uppercase', letterSpacing: 2,
            padding: '5px 0', margin: '22px 0 8px',
            borderBottom: `1px solid ${isToday(date) ? 'rgba(212,168,67,.28)' : 'var(--border)'}`,
          }}>
            {fmtDate(date)}{isToday(date) ? ' · AUJOURD\'HUI 🔴' : ''}
          </div>
          {byDate[date].sort((a,b) => a.time.localeCompare(b.time)).map(m => {
            const t1 = getTeam(m.t1), t2 = getTeam(m.t2);
            const sc = scores[m.id];
            const isDone = sc !== undefined;
            const isFra = m.t1 === 'fra' || m.t2 === 'fra';
            const probs = matchProbs(m.t1, m.t2);
            return (
              <div key={m.id}
                onClick={() => setModalId(m.id)}
                style={{
                  background: 'var(--bg2)',
                  border: `1px solid ${isFra ? 'rgba(0,49,137,.8)' : isDone ? 'rgba(34,197,94,.35)' : 'var(--border)'}`,
                  borderRadius: 'var(--r2)',
                  padding: '11px 14px', marginBottom: 5,
                  display: 'flex', alignItems: 'center', gap: 12,
                  cursor: 'pointer', transition: 'border-color .2s, background .15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background='var(--bg3)'; (e.currentTarget as HTMLDivElement).style.borderColor=isFra?'rgba(0,49,137,.9)':isDone?'rgba(34,197,94,.5)':'var(--border2)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background='var(--bg2)'; (e.currentTarget as HTMLDivElement).style.borderColor=isFra?'rgba(0,49,137,.8)':isDone?'rgba(34,197,94,.35)':'var(--border)'; }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0, minWidth: 46 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{m.time}</div>
                  <div style={{ fontSize: 10, color: 'var(--text3)' }}>Grp {m.grp}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}>
                    <Flag code={t1.flag} width={20} height={15} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t1.name}</span>
                    <span style={{ color: 'var(--text3)', padding: '0 3px', flexShrink: 0 }}>vs</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t2.name}</span>
                    <Flag code={t2.flag} width={20} height={15} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, color: 'var(--text3)' }}>📍 {m.venue}</span>
                    <TVBadge m6={m.m6} />
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, minWidth: 120, flexShrink: 0 }}>
                  {isDone ? (
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--gold)', fontVariantNumeric: 'tabular-nums' }}>{sc[0]} – {sc[1]}</div>
                  ) : (
                    <>
                      <ProbBar w={probs.w} d={probs.d} l={probs.l} height={16} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: 9, color: 'var(--text3)' }}>
                        <span>V {probs.w}%</span><span>N {probs.d}%</span><span>D {probs.l}%</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {/* KO phases */}
      {(filter === 'all' || filter === 'pending') && (KO_SCHEDULE as any[]).map((round: any) => (
        <div key={round.phase}>
          <div style={{ background: 'linear-gradient(90deg,rgba(212,168,67,.08),transparent)', border: '1px solid rgba(212,168,67,.18)', borderRadius: 'var(--r2)', padding: '9px 14px', margin: '24px 0 10px', fontSize: 10.5, fontWeight: 700, color: 'var(--gold)', letterSpacing: 1.2, textTransform: 'uppercase' }}>
            {round.phase}
          </div>
          {round.matches.map((m: any) => (
            <div key={m.id} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: '11px 14px', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ minWidth: 46 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{m.time}</div>
                <div style={{ fontSize: 10, color: 'var(--text3)' }}>{fmtDate(m.date)}</div>
              </div>
              <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--text2)', fontStyle: 'italic' }}>🔒 {m.label}</div>
              <TVBadge m6={m.m6} />
            </div>
          ))}
        </div>
      ))}

      <MatchModal schedId={modalId} onClose={() => setModalId(null)} />
    </div>
  );
}
