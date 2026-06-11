import { FD_TOKEN, AF_TOKEN, SCHEDULE } from '../data';

export interface MatchDetail {
  goals: Goal[];
  subs: Sub[];
  lineup1: string[];
  lineup2: string[];
  stats: MatchStats | null;
  detail: any;
}

export interface Goal {
  minute: string | number;
  scorer: string;
  team: 't1' | 't2';
  type: string;
}

export interface Sub {
  minute: string | number;
  playerIn: string;
  playerOut: string;
  team: 't1' | 't2';
}

export interface MatchStats {
  xg1?: number; xg2?: number;
  p1?: number;  p2?: number;
  sh1?: number; sh2?: number;
  sot1?: number;sot2?: number;
  cor1?: number;cor2?: number;
  foul1?: number;foul2?: number;
  yc1?: number; yc2?: number;
}

function mapFD(name: string): string {
  const FD_TEAMS: Record<string, string> = {
    'Mexico':'mex','South Africa':'rsa','Korea Republic':'kor','Czechia':'cze',
    'Canada':'can','Bosnia and Herzegovina':'bih','Switzerland':'sui','Qatar':'qat',
    'Brazil':'bra','Morocco':'mar','Scotland':'sco','Haiti':'hai',
    'United States':'usa','Paraguay':'par','Türkiye':'tur','Turkey':'tur','Australia':'aus',
    'Germany':'ger','Ecuador':'ecu','Ivory Coast':'civ','Côte d\'Ivoire':'civ',
    'Netherlands':'ned','Japan':'jpn','Sweden':'swe','Tunisia':'tun',
    'Belgium':'bel','Egypt':'egy','IR Iran':'irn','Iran':'irn','New Zealand':'nzl',
    'Spain':'esp','Cape Verde':'cpv','Saudi Arabia':'sau','Uruguay':'uru',
    'France':'fra','Senegal':'sen','Norway':'nor','Iraq':'irq',
    'Argentina':'arg','Austria':'aut','Algeria':'alg','Jordan':'jor',
    'Portugal':'por','Colombia':'col','Uzbekistan':'uzb','DR Congo':'cod',
    'England':'eng','Croatia':'cro','Panama':'pan','Ghana':'gha','Curacao':'cur',
  };
  return FD_TEAMS[name] || '';
}

const AF_TEAMS: Record<string, string> = Object.assign({}, {
  'Mexico':'mex','South Africa':'rsa','Korea Republic':'kor','South Korea':'kor',
  'Czech Republic':'cze','Czechia':'cze','Bosnia and Herzegovina':'bih','Switzerland':'sui',
  'Brazil':'bra','Morocco':'mar','Scotland':'sco','Haiti':'hai',
  'United States':'usa','USA':'usa','Paraguay':'par','Turkey':'tur','Turkiye':'tur',
  'Australia':'aus','Germany':'ger','Ecuador':'ecu','Ivory Coast':'civ',
  "Cote d'Ivoire":'civ','Netherlands':'ned','Japan':'jpn','Sweden':'swe',
  'Tunisia':'tun','Belgium':'bel','Egypt':'egy','Iran':'irn','IR Iran':'irn',
  'New Zealand':'nzl','Spain':'esp','Cape Verde':'cpv','Saudi Arabia':'sau',
  'Uruguay':'uru','France':'fra','Senegal':'sen','Norway':'nor','Iraq':'irq',
  'Argentina':'arg','Austria':'aut','Algeria':'alg','Jordan':'jor',
  'Portugal':'por','Colombia':'col','Uzbekistan':'uzb','DR Congo':'cod',
  'England':'eng','Croatia':'cro','Panama':'pan','Ghana':'gha','Curacao':'cur',
  'Curaçao':'cur','Canada':'can',
});
function mapAF(name: string): string { return AF_TEAMS[name] || mapFD(name) || ''; }

export const statsCache: Record<string, MatchStats> = {};
export const scoresCache: Record<string, [number, number]> = {};

export async function fetchAllLive(): Promise<void> {
  if (!FD_TOKEN || (FD_TOKEN as string) === 'VOTRE_TOKEN_ICI') return;
  try {
    const r = await fetch(
      'https://api.football-data.org/v4/competitions/WC/matches?status=IN_PLAY,PAUSED,FINISHED',
      { headers: { 'X-Auth-Token': FD_TOKEN } }
    );
    if (!r.ok) return;
    const data = await r.json();
    for (const m of (data.matches || [])) {
      const h = mapFD(m.homeTeam?.name || '');
      const a = mapFD(m.awayTeam?.name || '');
      if (!h || !a) continue;
      const sched = (SCHEDULE as any[]).find(s => (s.t1===h&&s.t2===a)||(s.t1===a&&s.t2===h));
      if (!sched) continue;
      const hg = m.score?.fullTime?.home ?? null;
      const ag = m.score?.fullTime?.away ?? null;
      if (hg === null) continue;
      const isHome = sched.t1 === h;
      scoresCache[sched.id] = isHome ? [hg, ag] : [ag, hg];
    }
  } catch {}
}

export async function fetchMatchDetail(schedId: string): Promise<MatchDetail | null> {
  const sched = (SCHEDULE as any[]).find(s => s.id === schedId);
  if (!sched) return null;

  // Try api-football first (has lineups + stats)
  if (AF_TOKEN && (AF_TOKEN as string) !== 'VOTRE_CLE_API_FOOTBALL') {
    return fetchAFDetail(sched);
  }
  // Fallback to football-data
  return fetchFDDetail(sched);
}

async function fetchAFDetail(sched: any): Promise<MatchDetail | null> {
  try {
    const r = await fetch(
      `https://v3.football.api-sports.io/fixtures?league=1&season=2026`,
      { headers: { 'x-apisports-key': AF_TOKEN } }
    );
    if (!r.ok) return null;
    const data = await r.json();
    const fix = (data.response || []).find((f: any) => {
      const h = mapAF(f.teams?.home?.name || '');
      const a = mapAF(f.teams?.away?.name || '');
      return (h===sched.t1&&a===sched.t2)||(h===sched.t2&&a===sched.t1);
    });
    if (!fix) return null;

    const fixId = fix.fixture?.id;
    const isHome = mapAF(fix.teams.home.name) === sched.t1;

    const [rL, rS, rE] = await Promise.all([
      fetch(`https://v3.football.api-sports.io/fixtures/lineups?fixture=${fixId}`, { headers: {'x-apisports-key': AF_TOKEN} }),
      fetch(`https://v3.football.api-sports.io/fixtures/statistics?fixture=${fixId}`, { headers: {'x-apisports-key': AF_TOKEN} }),
      fetch(`https://v3.football.api-sports.io/fixtures/events?fixture=${fixId}`, { headers: {'x-apisports-key': AF_TOKEN} }),
    ]);

    const lineupData = rL.ok ? (await rL.json()).response : [];
    const statsData  = rS.ok ? (await rS.json()).response : [];
    const eventsData = rE.ok ? (await rE.json()).response : [];

    let lineup1: string[] = [], lineup2: string[] = [];
    const detail: any = { lineups: [] };

    for (const l of lineupData) {
      const forT1 = mapAF(l.team?.name || '') === sched.t1;
      const players = (l.startXI || []).map((p: any) => p.player?.name || '?');
      detail.lineups.push({
        team: l.team,
        formation: l.formation || '4-3-3',
        startXI: (l.startXI || []).map((p: any) => ({ player: { name: p.player?.name, position: p.player?.pos, shirtNumber: p.player?.number } })),
        bench: (l.substitutes || []).map((p: any) => ({ player: { name: p.player?.name, shirtNumber: p.player?.number } })),
      });
      if (forT1) lineup1 = players; else lineup2 = players;
    }

    function getStat(arr: any[], label: string) {
      return arr?.find((x: any) => x.type === label)?.value ?? undefined;
    }
    let stats: MatchStats | null = null;
    if (statsData.length >= 2) {
      const s1 = statsData.find((s: any) => mapAF(s.team?.name||'')===sched.t1) || {statistics:[]};
      const s2 = statsData.find((s: any) => mapAF(s.team?.name||'')===sched.t2) || {statistics:[]};
      stats = {
        xg1: getStat(s1.statistics,'expected_goals'), xg2: getStat(s2.statistics,'expected_goals'),
        p1: parseFloat(getStat(s1.statistics,'Ball Possession')), p2: parseFloat(getStat(s2.statistics,'Ball Possession')),
        sh1: getStat(s1.statistics,'Total Shots'), sh2: getStat(s2.statistics,'Total Shots'),
        sot1: getStat(s1.statistics,'Shots on Goal'), sot2: getStat(s2.statistics,'Shots on Goal'),
        cor1: getStat(s1.statistics,'Corner Kicks'), cor2: getStat(s2.statistics,'Corner Kicks'),
        foul1: getStat(s1.statistics,'Fouls'), foul2: getStat(s2.statistics,'Fouls'),
        yc1: getStat(s1.statistics,'Yellow Cards'), yc2: getStat(s2.statistics,'Yellow Cards'),
      };
      statsCache[sched.id] = stats;
    }

    const goals: Goal[] = [], subs: Sub[] = [];
    for (const ev of eventsData) {
      const forT1 = mapAF(ev.team?.name||'') === sched.t1;
      const min = `${ev.time?.elapsed||0}${ev.time?.extra?'+'+ev.time.extra:''}`;
      if (ev.type === 'Goal') goals.push({ minute: min, scorer: ev.player?.name||'?', team: forT1?'t1':'t2', type: ev.detail==='Penalty'?'PENALTY':ev.detail==='Own Goal'?'OWN_GOAL':'' });
      else if (ev.type === 'subst') subs.push({ minute: min, playerIn: ev.player?.name||'?', playerOut: ev.assist?.name||'?', team: forT1?'t1':'t2' });
    }

    const hg = fix.score?.fulltime?.home ?? null;
    const ag = fix.score?.fulltime?.away ?? null;
    if (hg !== null) scoresCache[sched.id] = isHome ? [hg, ag] : [ag, hg];

    return { goals, subs, lineup1, lineup2, stats, detail };
  } catch { return null; }
}

async function fetchFDDetail(sched: any): Promise<MatchDetail | null> {
  try {
    const r = await fetch('https://api.football-data.org/v4/competitions/WC/matches', { headers: {'X-Auth-Token': FD_TOKEN} });
    if (!r.ok) return null;
    const data = await r.json();
    const fdMatch = (data.matches||[]).find((fm: any) => {
      const h = mapFD(fm.homeTeam?.name||''), a = mapFD(fm.awayTeam?.name||'');
      return (h===sched.t1&&a===sched.t2)||(h===sched.t2&&a===sched.t1);
    });
    if (!fdMatch) return null;
    const r2 = await fetch(`https://api.football-data.org/v4/matches/${fdMatch.id}`, { headers: {'X-Auth-Token': FD_TOKEN} });
    if (!r2.ok) return null;
    const detail = await r2.json();
    const isHome = mapFD(fdMatch.homeTeam.name) === sched.t1;
    const hg = detail.score?.fullTime?.home ?? null;
    const ag = detail.score?.fullTime?.away ?? null;
    if (hg !== null) scoresCache[sched.id] = isHome ? [hg, ag] : [ag, hg];
    const goals = (detail.goals||[]).map((g: any) => ({ minute: g.minute, scorer: g.scorer?.name||'?', team: mapFD(g.team?.name||'')===sched.t1?'t1' as const:'t2' as const, type: g.type||'' }));
    const subs = (detail.substitutions||[]).map((s: any) => ({ minute: s.minute, playerOut: s.playerOut?.name||'?', playerIn: s.playerIn?.name||'?', team: mapFD(s.team?.name||'')===sched.t1?'t1' as const:'t2' as const }));
    return { goals, subs, lineup1: [], lineup2: [], stats: null, detail };
  } catch { return null; }
}
