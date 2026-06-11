import React, { useState, useEffect, useCallback } from 'react';
import { SCHEDULE, GROUPS, SQ, matchProbs, fmtDate, getTeam } from '../data';
import { fetchMatchDetail, MatchDetail, MatchStats } from '../lib/api';
import { useApp } from '../context/AppContext';
import Flag from './Flag';
import ProbBar from './ProbBar';

interface Props { schedId: string | null; onClose: () => void; }

type Tab = 'résumé' | 'stats' | 'compos';

// ── Pitch SVG ──────────────────────────────────────────────────
function PitchSVG({ detail, lineup1, lineup2, t1, t2 }: { detail: any; lineup1: string[]; lineup2: string[]; t1: any; t2: any }) {
  const W = 680, H = 480;

  function mapAFTeamLocal(name: string): string {
    const m: Record<string,string> = { 'France':'fra','Mexique':'mex','Espagne':'esp','Allemagne':'ger','Brésil':'bra','Angleterre':'eng','Portugal':'por','Argentine':'arg' };
    return m[name] || name.toLowerCase().slice(0,3);
  }

  function getLineupFromDetail(side: 't1'|'t2') {
    if (!detail?.lineups?.length) return null;
    const teamId = side === 't1' ? t1.id : t2.id;
    const l = detail.lineups.find((l: any) => {
      const n = l.team?.name || '';
      const mapped = Object.entries({ Mexico:'mex','South Africa':'rsa','Korea Republic':'kor',Czechia:'cze',Canada:'can',Brazil:'bra',Morocco:'mar',Scotland:'sco',Haiti:'hai','United States':'usa',Paraguay:'par',Turkey:'tur',Turkiye:'tur',Australia:'aus',Germany:'ger',Ecuador:'ecu','Ivory Coast':'civ',Netherlands:'ned',Japan:'jpn',Sweden:'swe',Tunisia:'tun',Belgium:'bel',Egypt:'egy','IR Iran':'irn',Iran:'irn','New Zealand':'nzl',Spain:'esp','Cape Verde':'cpv','Saudi Arabia':'sau',Uruguay:'uru',France:'fra',Senegal:'sen',Norway:'nor',Iraq:'irq',Argentina:'arg',Austria:'aut',Algeria:'alg',Jordan:'jor',Portugal:'por',Colombia:'col',Uzbekistan:'uzb','DR Congo':'cod',England:'eng',Croatia:'cro',Panama:'pan',Ghana:'gha',Curacao:'cur' }).find(([k]) => k === n);
      return mapped ? mapped[1] === teamId : false;
    });
    if (!l) return null;
    return { formation: l.formation || '4-3-3', players: (l.startXI || []).map((p: any) => ({ name: p.player?.name || '?', pos: p.player?.position || 'Midfielder' })), bench: l.bench || [] };
  }

  function buildRows(players: any[], formation: string) {
    const parts = (formation || '4-3-3').split('-').map(Number);
    const rows: any[][] = [];
    let idx = 0;
    rows.push(players.slice(idx, idx + 1)); idx++;
    parts.forEach(n => { rows.push(players.slice(idx, idx + n)); idx += n; });
    return rows;
  }

  const raw1 = lineup1.length >= 11 ? lineup1.map(n => ({ name: n, pos: 'Midfielder' })) : null;
  const raw2 = lineup2.length >= 11 ? lineup2.map(n => ({ name: n, pos: 'Midfielder' })) : null;
  const dl1 = getLineupFromDetail('t1');
  const dl2 = getLineupFromDetail('t2');
  const p1 = dl1?.players || raw1;
  const p2 = dl2?.players || raw2;
  const f1 = dl1?.formation || '4-3-3';
  const f2 = dl2?.formation || '4-4-2';

  if (!p1 && !p2) {
    return (
      <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden' }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 10 }}>
          <rect width={W} height={H} fill="#1a5c2e"/>
          <rect x={16} y={12} width={W-32} height={H-24} rx={2} fill="none" stroke="rgba(255,255,255,.35)" strokeWidth={1.5}/>
          <line x1={16} y1={H/2} x2={W-16} y2={H/2} stroke="rgba(255,255,255,.35)" strokeWidth={1.2}/>
          <circle cx={W/2} cy={H/2} r={44} fill="none" stroke="rgba(255,255,255,.35)" strokeWidth={1.2}/>
          <rect x={W/2-75} y={12} width={150} height={70} fill="none" stroke="rgba(255,255,255,.35)" strokeWidth={1.2}/>
          <rect x={W/2-75} y={H-82} width={150} height={70} fill="none" stroke="rgba(255,255,255,.35)" strokeWidth={1.2}/>
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.55)', borderRadius: 10, gap: 8 }}>
          <div style={{ fontSize: 32 }}>🔒</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,.9)' }}>Composition non encore connue</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)' }}>Disponible ~1h avant le coup d'envoi</div>
        </div>
      </div>
    );
  }

  const posColor: Record<string,string> = { GK:'#f59e0b', Goalkeeper:'#f59e0b', Defender:'#5b7fff', Midfielder:'#22c55e', Forward:'#ef4444', ATT:'#ef4444', DEF:'#5b7fff', MID:'#22c55e' };
  const rows1 = p1 ? buildRows(p1, f1) : [];
  const rows2 = p2 ? buildRows(p2, f2) : [];
  const n1 = rows1.length, n2 = rows2.length;
  const y1 = rows1.map((_, i) => H * 0.93 - (i / Math.max(n1-1,1)) * (H * 0.43));
  const y2 = rows2.map((_, i) => H * 0.07 + (i / Math.max(n2-1,1)) * (H * 0.43));

  function shortName(name: string) {
    const parts = name.trim().split(' ');
    let last = parts[parts.length - 1];
    if (last.length <= 3 && parts.length > 1) last = parts[parts.length-2] + ' ' + last;
    return last.length > 11 ? last.slice(0,10)+'…' : last;
  }

  const dots1: React.ReactNode[] = [], dots2: React.ReactNode[] = [];
  rows1.forEach((row, ri) => {
    const y = y1[ri];
    row.forEach((p: any, pi: number) => {
      const x = (pi + 1) * W / (row.length + 1);
      const col = ri === 0 ? '#f59e0b' : (posColor[p.pos] || '#aaa');
      dots1.push(
        <g key={`t1-${ri}-${pi}`}>
          <circle cx={x} cy={y} r={13} fill={col} fillOpacity={0.22} stroke={col} strokeWidth={1.8}/>
          <circle cx={x} cy={y} r={7} fill={col}/>
          <rect x={x-22} y={y+13} width={44} height={13} rx={2.5} fill="rgba(0,0,0,.78)"/>
          <text x={x} y={y+22} textAnchor="middle" fontFamily="Inter,sans-serif" fontSize={8.5} fontWeight={600} fill="white">{shortName(p.name || p)}</text>
        </g>
      );
    });
  });
  rows2.forEach((row, ri) => {
    const y = y2[ri];
    row.forEach((p: any, pi: number) => {
      const x = (pi + 1) * W / (row.length + 1);
      const col = ri === 0 ? '#f59e0b' : (posColor[p.pos] || '#aaa');
      dots2.push(
        <g key={`t2-${ri}-${pi}`}>
          <circle cx={x} cy={y} r={13} fill={col} fillOpacity={0.22} stroke={col} strokeWidth={1.8}/>
          <circle cx={x} cy={y} r={7} fill={col}/>
          <rect x={x-22} y={y+13} width={44} height={13} rx={2.5} fill="rgba(0,0,0,.78)"/>
          <text x={x} y={y+22} textAnchor="middle" fontFamily="Inter,sans-serif" fontSize={8.5} fontWeight={600} fill="white">{shortName(p.name || p)}</text>
        </g>
      );
    });
  });

  const lc = 'rgba(255,255,255,.4)';
  return (
    <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        <rect width={W} height={H} fill="#1a5c2e"/>
        {[0,1,2,3,4,5,6,7].map(i => <rect key={i} x={i*W/8} y={0} width={W/8} height={H} fill={i%2?'rgba(0,0,0,.05)':'none'}/>)}
        <rect x={16} y={12} width={W-32} height={H-24} rx={2} fill="none" stroke={lc} strokeWidth={1.5}/>
        <line x1={16} y1={H/2} x2={W-16} y2={H/2} stroke={lc} strokeWidth={1.2}/>
        <circle cx={W/2} cy={H/2} r={44} fill="none" stroke={lc} strokeWidth={1.2}/>
        <circle cx={W/2} cy={H/2} r={3} fill={lc}/>
        <rect x={W/2-75} y={12} width={150} height={70} fill="none" stroke={lc} strokeWidth={1.2}/>
        <rect x={W/2-34} y={12} width={68} height={26} fill="none" stroke={lc} strokeWidth={1}/>
        <rect x={W/2-75} y={H-82} width={150} height={70} fill="none" stroke={lc} strokeWidth={1.2}/>
        <rect x={W/2-34} y={H-38} width={68} height={26} fill="none" stroke={lc} strokeWidth={1}/>
        <rect x={W/2-24} y={6} width={48} height={8} fill="rgba(255,255,255,.1)" stroke={lc} strokeWidth={1}/>
        <rect x={W/2-24} y={H-14} width={48} height={8} fill="rgba(255,255,255,.1)" stroke={lc} strokeWidth={1}/>
        <rect x={16} y={H/2-18} width={118} height={18} rx={3} fill="rgba(0,0,0,.55)"/>
        <text x={75} y={H/2-5} textAnchor="middle" fontFamily="Inter,sans-serif" fontSize={10} fontWeight={700} fill="rgba(255,255,255,.8)">{f1} · {t1.name}</text>
        <rect x={W-134} y={H/2} width={118} height={18} rx={3} fill="rgba(0,0,0,.55)"/>
        <text x={W-75} y={H/2+13} textAnchor="middle" fontFamily="Inter,sans-serif" fontSize={10} fontWeight={700} fill="rgba(255,255,255,.8)">{f2} · {t2.name}</text>
        {dots2}{dots1}
      </svg>
    </div>
  );
}

// ── Stat Row ───────────────────────────────────────────────────
function StatRow({ label, v1, v2, p1, p2 }: { label: string; v1: any; v2: any; p1: number; p2: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 8, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 5 }}>{v1 ?? '—'}</div>
        <div style={{ height: 4, background: 'var(--bg4)', borderRadius: 2 }}>
          <div style={{ height: '100%', width: `${p1}%`, background: 'var(--gold)', borderRadius: 2, marginLeft: 'auto' }}/>
        </div>
      </div>
      <div style={{ fontSize: 10, color: 'var(--text2)', fontWeight: 600, textAlign: 'center', whiteSpace: 'nowrap', padding: '0 6px', minWidth: 120 }}>{label}</div>
      <div style={{ textAlign: 'left' }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 5, color: 'var(--accent2)' }}>{v2 ?? '—'}</div>
        <div style={{ height: 4, background: 'var(--bg4)', borderRadius: 2 }}>
          <div style={{ height: '100%', width: `${p2}%`, background: 'var(--accent2)', borderRadius: 2 }}/>
        </div>
      </div>
    </div>
  );
}

function pct(v1: any, v2: any): [number, number] {
  const n1 = parseFloat(v1), n2 = parseFloat(v2);
  if (isNaN(n1) || isNaN(n2) || n1 + n2 === 0) return [50, 50];
  return [Math.round(n1/(n1+n2)*100), Math.round(n2/(n1+n2)*100)];
}

// ── Main Modal ─────────────────────────────────────────────────
export default function MatchModal({ schedId, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('résumé');
  const [detail, setDetail] = useState<MatchDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const { scores } = useApp();

  const m = schedId ? (SCHEDULE as any[]).find(s => s.id === schedId) : null;

  const load = useCallback(async () => {
    if (!schedId) return;
    setLoading(true);
    const d = await fetchMatchDetail(schedId);
    setDetail(d);
    setLoading(false);
  }, [schedId]);

  useEffect(() => {
    if (schedId) { setTab('résumé'); setDetail(null); load(); }
  }, [schedId, load]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!m || !schedId) return null;

  const t1 = getTeam(m.t1), t2 = getTeam(m.t2);
  const sc = scores[m.id];
  const isLive = false; // TODO: integrate live status
  const isDone = sc !== undefined;
  const probs = matchProbs(m.t1, m.t2);
  const sq1 = (SQ as any)[m.t1], sq2 = (SQ as any)[m.t2];
  const stats: MatchStats | null = detail?.stats || null;

  const tvBadge = (m6: boolean) => (
    <div style={{ display: 'flex', gap: 4 }}>
      <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'rgba(255,140,0,.14)', color: '#ffb347', border: '1px solid rgba(255,140,0,.22)' }}>beIN</span>
      {m6 && <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'rgba(0,120,255,.14)', color: '#6ab4ff', border: '1px solid rgba(0,120,255,.22)' }}>M6</span>}
    </div>
  );

  const TABS: Tab[] = ['résumé', 'stats', 'compos'];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(8px)', padding: 16,
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border2)',
        borderRadius: 16, width: '100%', maxWidth: 760, maxHeight: '90vh',
        overflowY: 'auto', position: 'relative',
        animation: 'fadeIn .2s ease',
      }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,var(--bg3),var(--bg4))', padding: '18px 22px', borderBottom: '1px solid var(--border)', borderRadius: '16px 16px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1 }}>Groupe {m.grp} · {fmtDate(m.date)} {m.time}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {tvBadge(m.m6)}
              <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border2)', background: 'var(--bg3)', color: 'var(--text2)', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 16, marginTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Flag code={t1.flag} width={40} height={30} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{t1.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text2)' }}>FIFA #{t1.fifa}</div>
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              {isDone ? (
                <>
                  <div style={{ fontSize: 36, fontWeight: 900, fontVariantNumeric: 'tabular-nums', letterSpacing: -1 }}>
                    {sc[0]} <span style={{ color: 'var(--text3)' }}>–</span> {sc[1]}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 700, marginTop: 4 }}>✅ TERMINÉ</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 20, color: 'var(--text3)', fontWeight: 700 }}>VS</div>
                  <div style={{ marginTop: 8, maxWidth: 160, margin: '8px auto 0' }}>
                    <ProbBar w={probs.w} d={probs.d} l={probs.l} height={18} />
                  </div>
                </>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexDirection: 'row-reverse' }}>
              <Flag code={t2.flag} width={40} height={30} />
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{t2.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text2)' }}>FIFA #{t2.fifa}</div>
              </div>
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', marginTop: 10 }}>📍 {m.venue}</div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 22px' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '12px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              color: tab === t ? 'var(--gold)' : 'var(--text2)',
              background: 'none', border: 'none',
              borderBottom: tab === t ? '2px solid var(--gold)' : '2px solid transparent',
              transition: 'all .2s', fontFamily: 'inherit', textTransform: 'capitalize',
            }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
          ))}
          {loading && <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', padding: '0 12px' }}>
            <div style={{ width: 16, height: 16, border: '2px solid var(--border2)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin .7s linear infinite' }}/>
          </div>}
        </div>

        <div style={{ padding: '0 22px 22px' }}>
          {/* RÉSUMÉ */}
          {tab === 'résumé' && (
            <div style={{ paddingTop: 16 }}>
              {isDone || isLive ? (
                <>
                  {detail?.goals?.length ? (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 700, marginBottom: 10 }}>⚽ Buts</div>
                      {detail.goals.map((g, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)', minWidth: 36 }}>{g.minute}'</span>
                          {g.team === 't1' ? (
                            <><span style={{ flex: 1, fontSize: 13 }}>{g.scorer}</span><span style={{ fontSize: 11, color: 'var(--text3)' }}>{g.type === 'PENALTY' ? '⚽ Pen.' : g.type === 'OWN_GOAL' ? 'CSC' : ''}</span></>
                          ) : (
                            <><span style={{ fontSize: 11, color: 'var(--text3)' }}>{g.type === 'PENALTY' ? 'Pen. ' : g.type === 'OWN_GOAL' ? 'CSC ' : ''}</span><span style={{ flex: 1, textAlign: 'right', fontSize: 13 }}>{g.scorer}</span></>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : <p style={{ color: 'var(--text3)', fontSize: 13 }}>Aucun but</p>}
                  {detail?.subs?.length ? (
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 700, marginBottom: 10 }}>🔄 Remplacements</div>
                      {detail.subs.map((s, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--yellow)', minWidth: 36 }}>{s.minute}'</span>
                          <span style={{ color: 'var(--green)', fontSize: 12 }}>↗ {s.playerIn}</span>
                          <span style={{ color: 'var(--text3)' }}>·</span>
                          <span style={{ color: 'var(--red)', fontSize: 12 }}>↘ {s.playerOut}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text3)' }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>🕐</div>
                  <div style={{ fontSize: 14, color: 'var(--text2)' }}>Match à venir · {fmtDate(m.date)} à {m.time}</div>
                  <div style={{ marginTop: 16, maxWidth: 240, margin: '16px auto 0' }}>
                    <ProbBar w={probs.w} d={probs.d} l={probs.l} height={24} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text3)', marginTop: 4 }}>
                      <span>V. {t1.name}</span><span>Nul</span><span>V. {t2.name}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STATS */}
          {tab === 'stats' && (
            <div style={{ paddingTop: 16 }}>
              {!isDone && !isLive ? (
                <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text3)' }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
                  <div style={{ fontSize: 14, color: 'var(--text2)', fontWeight: 500 }}>Stats disponibles pendant et après le match</div>
                  <div style={{ fontSize: 12, marginTop: 6 }}>Mise à jour automatique toutes les 60 secondes</div>
                </div>
              ) : stats ? (
                <>
                  <StatRow label="xG (Expected Goals)" v1={stats.xg1} v2={stats.xg2} p1={pct(stats.xg1,stats.xg2)[0]} p2={pct(stats.xg1,stats.xg2)[1]}/>
                  <StatRow label="Possession" v1={`${stats.p1}%`} v2={`${stats.p2}%`} p1={stats.p1||50} p2={stats.p2||50}/>
                  <StatRow label="Tirs totaux" v1={stats.sh1} v2={stats.sh2} p1={pct(stats.sh1,stats.sh2)[0]} p2={pct(stats.sh1,stats.sh2)[1]}/>
                  <StatRow label="Tirs cadrés" v1={stats.sot1} v2={stats.sot2} p1={pct(stats.sot1,stats.sot2)[0]} p2={pct(stats.sot1,stats.sot2)[1]}/>
                  <StatRow label="Corners" v1={stats.cor1} v2={stats.cor2} p1={pct(stats.cor1,stats.cor2)[0]} p2={pct(stats.cor1,stats.cor2)[1]}/>
                  <StatRow label="Fautes" v1={stats.foul1} v2={stats.foul2} p1={pct(stats.foul1,stats.foul2)[0]} p2={pct(stats.foul1,stats.foul2)[1]}/>
                  <StatRow label="Cartons jaunes" v1={stats.yc1} v2={stats.yc2} p1={pct(stats.yc1,stats.yc2)[0]} p2={pct(stats.yc1,stats.yc2)[1]}/>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: 32, color: 'var(--text3)' }}>Chargement des stats...</div>
              )}
            </div>
          )}

          {/* COMPOS */}
          {tab === 'compos' && (
            <div style={{ paddingTop: 12 }}>
              <PitchSVG detail={detail?.detail} lineup1={detail?.lineup1 || []} lineup2={detail?.lineup2 || []} t1={t1} t2={t2}/>
              {(detail?.lineup1?.length || detail?.lineup2?.length) ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
                  {[{ lineup: detail?.lineup1, sq: sq1, team: t1, color: 'var(--gold)' }, { lineup: detail?.lineup2, sq: sq2, team: t2, color: 'var(--accent2)' }].map(({ lineup, sq, team, color }) => (
                    <div key={team.id}>
                      <div style={{ fontSize: 10, color, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, marginBottom: 8 }}>🔄 Remplaçants · {team.name}</div>
                      {sq ? sq.players.filter((p: any) => p.pos !== 'GK').slice(10, 15).map((p: any, i: number) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                          <span style={{ color: 'var(--text3)', minWidth: 22, fontSize: 10 }}>{p.n}</span>
                          <span style={{ flex: 1 }}>{p.name}</span>
                          <span style={{ color: 'var(--text3)', fontSize: 10 }}>{p.club}</span>
                        </div>
                      )) : <span style={{ color: 'var(--text3)', fontSize: 12 }}>—</span>}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
