// api/matches.js — Vercel Serverless Function (proxy API)
// Le navigateur appelle /api/matches → ce fichier appelle football-data.org
// Aucun problème CORS car c'est server-to-server

export default async function handler(req, res) {
  // CORS headers pour autoriser ton domaine Vercel
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  const { fixtureId, type, date } = req.query;
  
  const FD_KEY = '3a137ece784443cca360d8fc40435b73';
  const BASE = 'https://api.football-data.org/v4';
  
  try {
    let url;
    
    if (type === 'all') {
      // Tous les matchs CDM 2026
      url = `${BASE}/competitions/WC/matches?season=2026`;
    } else if (type === 'live') {
      // Matchs en direct uniquement
      url = `${BASE}/competitions/WC/matches?season=2026&status=IN_PLAY,PAUSED`;
    } else if (type === 'match' && fixtureId) {
      // Un match spécifique avec stats
      url = `${BASE}/matches/${fixtureId}`;
    } else {
      return res.status(400).json({ error: 'Paramètre manquant' });
    }
    
    const response = await fetch(url, {
      headers: {
        'X-Auth-Token': FD_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err });
    }
    
    const data = await response.json();
    return res.status(200).json(data);
    
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
