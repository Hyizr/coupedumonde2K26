import React from 'react';

interface Props { w: number; d: number; l: number; height?: number; }

export default function ProbBar({ w, d, l, height = 20 }: Props) {
  return (
    <div style={{ display: 'flex', width: '100%', height, borderRadius: 5, overflow: 'hidden', minWidth: 160 }}>
      <div style={{ width: `${w}%`, background: 'rgba(34,197,94,.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 0 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.85)' }}>{w}%</span>
      </div>
      <div style={{ width: `${d}%`, background: 'rgba(120,120,140,.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 0 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.85)' }}>{d}%</span>
      </div>
      <div style={{ width: `${l}%`, background: 'rgba(239,68,68,.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 0 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.85)' }}>{l}%</span>
      </div>
    </div>
  );
}
