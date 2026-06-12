// api/matches.js — Vercel Serverless Function
// Proxy server-side pour contourner CORS et restrictions de plan
// Le navigateur appelle /api/matches → ce fichier appelle football-data.org

const FD_KEY = '3a137ece784443cca360d8fc40435b73';
const BASE = 'https://api.football-data.org/v4';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { fixtureId, type } = req.query;

  try {
    let url;

    if (type === 'all') {
      // Tous les 104 matchs de la CDM 2026
      url = `${BASE}/competitions/WC/matches?season=2026`;
    } else if (type === 'live') {
      // Matchs en cours uniquement
      url = `${BASE}/competitions/WC/matches?season=2026&status=IN_PLAY,PAUSED`;
    } else if (type === 'match' && fixtureId) {
      // Détail d'un match: score, buts, cartons, changements, compositions
      url = `${BASE}/matches/${fixtureId}`;
    } else {
      return res.status(400).json({ error: 'Paramètre invalide. Utilise type=all|live|match&fixtureId=X' });
    }

    const response = await fetch(url, {
      headers: {
        'X-Auth-Token': FD_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`football-data.org error ${response.status}:`, text);
      return res.status(response.status).json({ 
        error: `API error ${response.status}`,
        detail: text 
      });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ error: error.message });
  }
}
