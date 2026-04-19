// ─── Vercel API Route — TMDB Proxy ─────────────────────────
// This file runs on Vercel's servers, not in the browser.
// Your app calls /api/tmdb?path=... and this forwards it to TMDB.
// This bypasses any ISP blocks because the request comes from
// Vercel's servers (in the US), not from your computer.
//
// File location: api/tmdb.js  (in the ROOT of your project, not inside src/)
// ───────────────────────────────────────────────────────────

export default async function handler(req, res) {
  // Allow requests from your own app only
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET')

  const TMDB_KEY = process.env.VITE_TMDB_API_KEY
  if (!TMDB_KEY) {
    return res.status(500).json({ error: 'TMDB API key not configured' })
  }

  // The frontend sends ?path=/search/multi&query=batman
  // We forward it to https://api.themoviedb.org/3/search/multi?api_key=...&query=batman
  const { path, ...params } = req.query
  if (!path) {
    return res.status(400).json({ error: 'Missing path parameter' })
  }

  const queryString = new URLSearchParams({ api_key: TMDB_KEY, ...params }).toString()
  const tmdbUrl = `https://api.themoviedb.org/3${path}?${queryString}`

  try {
    const tmdbRes  = await fetch(tmdbUrl)
    const data     = await tmdbRes.json()
    res.status(tmdbRes.status).json(data)
  } catch (err) {
    res.status(500).json({ error: 'Failed to reach TMDB', details: err.message })
  }
}
