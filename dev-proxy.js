// ─── Local Dev Proxy ───────────────────────────────────────
import express from 'express'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Manually read .env file since dotenv sometimes misses VITE_ prefixed vars
function loadEnv() {
  try {
    const envFile = readFileSync(resolve(process.cwd(), '.env'), 'utf8')
    const vars = {}
    envFile.split('\n').forEach(line => {
      const [key, ...rest] = line.split('=')
      if (key && rest.length) vars[key.trim()] = rest.join('=').trim()
    })
    return vars
  } catch (e) {
    console.error('Could not read .env file:', e.message)
    return {}
  }
}

const env  = loadEnv()
const KEY  = env.VITE_TMDB_API_KEY
const PORT = 3001

if (!KEY) {
  console.error('ERROR: VITE_TMDB_API_KEY not found in .env file')
  console.error('Make sure your .env file has: VITE_TMDB_API_KEY=your_key_here')
  process.exit(1)
}

console.log(`TMDB key loaded: ${KEY.slice(0, 6)}...${KEY.slice(-4)}`)

const app = express()

app.get('/api/tmdb', async (req, res) => {
  res.header('Access-Control-Allow-Origin', '*')
  const { path, ...params } = req.query
  if (!path) return res.status(400).json({ error: 'Missing path' })

  const qs  = new URLSearchParams({ api_key: KEY, ...params }).toString()
  const url = `https://api.themoviedb.org/3${path}?${qs}`

  console.log(`→ TMDB: ${path}`)

  try {
    const r    = await fetch(url)
    const data = await r.json()
    if (data.status_message) console.error('TMDB error:', data.status_message)
    res.status(r.status).json(data)
  } catch (e) {
    console.error('Fetch failed:', e.message)
    res.status(500).json({ error: e.message })
  }
})

app.listen(PORT, () => {
  console.log(`Dev proxy running on http://localhost:${PORT}`)
  console.log('Waiting for requests...')
})
