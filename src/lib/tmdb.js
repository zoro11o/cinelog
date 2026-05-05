// ─── TMDB API ──────────────────────────────────────────────
const PROXY_URL = import.meta.env.VITE_PROXY_URL
const TMDB_KEY  = import.meta.env.VITE_TMDB_API_KEY

export const TMDB_IMAGE_BASE  = 'https://image.tmdb.org/t/p/w300'
export const TMDB_IMAGE_LARGE = 'https://image.tmdb.org/t/p/w500'

let directWorks = null

// ── In-memory cache (5 min TTL) ────────────────────────────
const cache     = new Map()
const CACHE_TTL = 5 * 60 * 1000

async function fetchWithTimeout(url, ms = 5000) {
  const controller = new AbortController()
  const timeout    = setTimeout(() => controller.abort(), ms)
  try {
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timeout)
    return res
  } catch (e) {
    clearTimeout(timeout)
    throw e
  }
}

async function tmdb(path, params = {}) {
  if (directWorks !== false && TMDB_KEY) {
    try {
      const qs  = new URLSearchParams({ api_key: TMDB_KEY, ...params }).toString()
      const res = await fetchWithTimeout(`https://api.themoviedb.org/3${path}?${qs}`)
      if (res.ok) {
        directWorks = true
        return res.json()
      }
    } catch (e) {
      directWorks = false
      console.log('TMDB: direct blocked, using proxy')
    }
  }

  if (PROXY_URL) {
    directWorks = false
    const proxyBase = PROXY_URL.replace(/\/$/, '')
    const qs  = new URLSearchParams({ path, ...params }).toString()
    const res = await fetch(`${proxyBase}/api/tmdb?${qs}`)
    const text = await res.text()
    try { return JSON.parse(text) }
    catch (e) { throw new Error('Proxy returned non-JSON response') }
  }

  throw new Error('Set VITE_TMDB_API_KEY or VITE_PROXY_URL in .env')
}

async function tmdbCached(path, params = {}) {
  const key = path + JSON.stringify(params)
  const hit = cache.get(key)
  if (hit && Date.now() - hit.ts < CACHE_TTL) return hit.data
  const data = await tmdb(path, params)
  cache.set(key, { data, ts: Date.now() })
  return data
}

// ── Search & Discover (always fresh) ───────────────────────

export async function searchMulti(query, filters = {}, page = 1) {
  if (!query.trim()) return { results: [], totalPages: 0 }
  const [movieRes, tvRes] = await Promise.allSettled([
    tmdb('/search/movie', { query, include_adult: false, page, ...filters }),
    tmdb('/search/tv',    { query, include_adult: false, page, ...filters }),
  ])
  const movies     = (movieRes.status === 'fulfilled' ? movieRes.value.results || [] : []).map(r => ({ ...r, media_type: 'movie' }))
  const tv         = (tvRes.status    === 'fulfilled' ? tvRes.value.results    || [] : []).map(r => ({ ...r, media_type: 'tv' }))
  const totalPages = Math.max(
    movieRes.status === 'fulfilled' ? movieRes.value.total_pages || 1 : 1,
    tvRes.status    === 'fulfilled' ? tvRes.value.total_pages    || 1 : 1,
  )
  const combined = []
  const max = Math.max(movies.length, tv.length)
  for (let i = 0; i < max; i++) {
    if (movies[i]) combined.push(movies[i])
    if (tv[i])     combined.push(tv[i])
  }
  return { results: combined, totalPages }
}

export async function searchPerson(query, page = 1) {
  if (!query.trim()) return { results: [], totalPages: 0 }
  const data = await tmdb('/search/person', { query, include_adult: false, page })
  return {
    results:    (data.results || []).map(r => ({ ...r, media_type: 'person' })),
    totalPages: data.total_pages || 1,
  }
}

export async function discoverMovies(filters = {}, page = 1) {
  const data = await tmdb('/discover/movie', { include_adult: false, page, ...filters })
  return { results: (data.results || []).map(r => ({ ...r, media_type: 'movie' })), totalPages: data.total_pages || 1 }
}

export async function discoverTV(filters = {}, page = 1) {
  const data = await tmdb('/discover/tv', { include_adult: false, page, ...filters })
  return { results: (data.results || []).map(r => ({ ...r, media_type: 'tv' })), totalPages: data.total_pages || 1 }
}

export async function getTrending(type = 'all', timeWindow = 'week', page = 1) {
  const data = await tmdb(`/trending/${type}/${timeWindow}`, { page })
  const results = (data.results || []).map(r => ({
    ...r,
    media_type: r.media_type || (type === 'movie' ? 'movie' : type === 'tv' ? 'tv' : r.media_type),
  })).filter(r => r.media_type === 'movie' || r.media_type === 'tv')
  return { results, totalPages: data.total_pages || 1 }
}

export async function getMovieGenres() {
  return (await tmdbCached('/genre/movie/list')).genres || []
}

export async function getTVGenres() {
  return (await tmdbCached('/genre/tv/list')).genres || []
}

// ── Detail endpoints (all cached) ──────────────────────────

export async function getDetails(id, type) {
  const data = await tmdbCached(`/${type}/${id}`)
  if (type === 'tv' && data) {
    const lastSeason = data.last_episode_to_air?.season_number
    if (lastSeason && lastSeason > 0 && !data._accurate_runtime) {
      try {
        const season   = await tmdbCached(`/tv/${id}/season/${lastSeason}`)
        const episodes = (season.episodes || []).filter(e => e.runtime > 0)
        if (episodes.length > 0) {
          data._accurate_runtime = Math.round(
            episodes.reduce((s, e) => s + e.runtime, 0) / episodes.length
          )
        }
      } catch {}
    }
  }
  return data
}

export async function getCredits(id, type) {
  return tmdbCached(`/${type}/${id}/credits`)
}

export async function getSeasons(showId) {
  const show = await tmdbCached(`/tv/${showId}`)
  return (show.seasons || []).filter(s => s.season_number > 0)
}

export async function getRelated(id, type) {
  if (type === 'movie') {
    try {
      const details = await tmdbCached(`/movie/${id}`)
      if (details?.belongs_to_collection?.id) {
        const collection = await tmdbCached(`/collection/${details.belongs_to_collection.id}`)
        const parts = (collection.parts || [])
          .filter(p => Number(p.id) !== Number(id))
          .sort((a, b) => (a.release_date || '').localeCompare(b.release_date || ''))
          .map(p => ({ ...p, media_type: 'movie' }))
        return { parts, collectionName: collection.name, collectionId: details.belongs_to_collection.id }
      }
      return { parts: [], collectionName: null, collectionId: null }
    } catch {
      return { parts: [], collectionName: null, collectionId: null }
    }
  } else {
    return { parts: [], collectionName: null, collectionId: null }
  }
}

export async function getCollection(collectionId) {
  try {
    const data = await tmdbCached(`/collection/${collectionId}`)
    return {
      name:    data.name || '',
      parts:   (data.parts || [])
        .sort((a, b) => (a.release_date || '').localeCompare(b.release_date || ''))
        .map(p => ({ ...p, media_type: 'movie' })),
      backdrop_path: data.backdrop_path || '',
      poster_path:   data.poster_path   || '',
    }
  } catch { return null }
}

function sortByDate(arr) {
  return [...arr].sort((a, b) => {
    const dateA = a.release_date || a.first_air_date || ''
    const dateB = b.release_date || b.first_air_date || ''
    return dateB.localeCompare(dateA)
  })
}

// Keywords that indicate a self-appearance / interview / talk show
const SELF_KEYWORDS = [
  'himself', 'herself', 'themselves', ' self', '(self)',
  'archive footage', 'archive', 'interview',
  'presenter', 'host', 'narrator', 'moderator',
  'himself -', 'herself -',
]

function isSelfAppearance(credit) {
  const ch = (credit.character || '').toLowerCase().trim()
  if (!ch) return false
  return SELF_KEYWORDS.some(k => ch.includes(k))
}

export async function getPersonCredits(personId) {
  const [person, credits] = await Promise.all([
    tmdbCached(`/person/${personId}`),
    tmdbCached(`/person/${personId}/combined_credits`),
  ])

  const primaryDept = person?.known_for_department || 'Acting'

  // ── Cast credits — split real acting vs self-appearances ──
  const allCast = (credits?.cast || []).filter(r => r.media_type === 'movie' || r.media_type === 'tv')

  // Deduplicate by id+media_type (same show can appear multiple times for different seasons)
  const seenCast = new Set()
  const dedupedCast = allCast.filter(r => {
    const k = `${r.id}-${r.media_type}`
    if (seenCast.has(k)) return false
    seenCast.add(k)
    return true
  })

  const actingCredits     = sortByDate(dedupedCast.filter(r => !isSelfAppearance(r)))
  const appearanceCredits = sortByDate(dedupedCast.filter(r => isSelfAppearance(r)))

  // ── Crew credits grouped by department ────────────────────
  const crewByDept = {}
  for (const r of (credits?.crew || [])) {
    if (r.media_type !== 'movie' && r.media_type !== 'tv') continue
    const dept = r.department || 'Crew'
    if (!crewByDept[dept]) crewByDept[dept] = []
    if (!crewByDept[dept].find(x => x.id === r.id && x.media_type === r.media_type)) {
      crewByDept[dept].push(r)
    }
  }
  for (const dept of Object.keys(crewByDept)) {
    crewByDept[dept] = sortByDate(crewByDept[dept])
  }

  // ── Build departments map ──────────────────────────────────
  const departments = {}
  if (actingCredits.length)     departments['Acting']      = actingCredits
  if (appearanceCredits.length) departments['Appearances'] = appearanceCredits
  for (const [dept, items] of Object.entries(crewByDept)) {
    if (items.length) departments[dept] = items
  }

  // ── Known For — only real acting/directing work, no self appearances ──
  const seen = new Set()
  const knownFor = [
    ...(crewByDept[primaryDept] || []),
    ...actingCredits,              // real acting only
    ...Object.values(crewByDept).flat(),
  ]
    .filter(r => {
      const k = `${r.id}-${r.media_type}`
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    .slice(0, 8)

  return { person, departments, knownFor, primaryDept }
}

export async function getMedia(id, type) {
  const [imagesData, videosData] = await Promise.all([
    tmdbCached(`/${type}/${id}/images`),
    tmdbCached(`/${type}/${id}/videos`),
  ])

  const backdrops = (imagesData?.backdrops || [])
    .sort((a, b) => b.vote_average - a.vote_average)
    .slice(0, 20)

  const posters = (imagesData?.posters || [])
    .filter(p => p.iso_639_1 === 'en' || p.iso_639_1 === null)
    .sort((a, b) => b.vote_average - a.vote_average)
    .slice(0, 12)

  const videos = (videosData?.results || [])
    .filter(v => v.site === 'YouTube')
    .sort((a, b) => {
      const order = ['Trailer', 'Teaser', 'Clip', 'Featurette', 'Behind the Scenes']
      return order.indexOf(a.type) - order.indexOf(b.type)
    })

  return { backdrops, posters, videos }
}
