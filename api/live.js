export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const r = await fetch(
    'https://api.football-data.org/v4/competitions/WC/matches?status=IN_PLAY,PAUSED,FINISHED',
    { headers: { 'X-Auth-Token': process.env.FD_TOKEN } }
  );

  const data = await r.json();
  res.json(data);
}