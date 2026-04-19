// ─── TMDB API ──────────────────────────────────────────────
const PROXY_URL = import.meta.env.VITE_PROXY_URL
const TMDB_KEY  = import.meta.env.VITE_TMDB_API_KEY

export const TMDB_IMAGE_BASE  = 'https://image.tmdb.org/t/p/w300'
export const TMDB_IMAGE_LARGE = 'https://image.tmdb.org/t/p/w500'

let directWorks = null

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

// Returns { results, totalPages } so SearchPage knows if more pages exist
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

export async function discoverMovies(filters = {}, page = 1) {
  const data = await tmdb('/discover/movie', { include_adult: false, page, ...filters })
  return { results: (data.results || []).map(r => ({ ...r, media_type: 'movie' })), totalPages: data.total_pages || 1 }
}

export async function discoverTV(filters = {}, page = 1) {
  const data = await tmdb('/discover/tv', { include_adult: false, page, ...filters })
  return { results: (data.results || []).map(r => ({ ...r, media_type: 'tv' })), totalPages: data.total_pages || 1 }
}

export async function getMovieGenres() {
  const data = await tmdb('/genre/movie/list')
  return data.genres || []
}

export async function getTVGenres() {
  const data = await tmdb('/genre/tv/list')
  return data.genres || []
}

// Get full details — for TV shows fetches episode runtime from most recent season
export async function getDetails(id, type) {
  const data = await tmdb(`/${type}/${id}`)
  if (type === 'tv' && data) {
    // episode_run_time is unreliable — fetch actual runtime from last aired season
    const lastSeason = data.last_episode_to_air?.season_number
    if (lastSeason && lastSeason > 0) {
      try {
        const season = await tmdb(`/tv/${id}/season/${lastSeason}`)
        const episodes = (season.episodes || []).filter(e => e.runtime > 0)
        if (episodes.length > 0) {
          const avgRuntime = Math.round(episodes.reduce((s, e) => s + e.runtime, 0) / episodes.length)
          data._accurate_runtime = avgRuntime
        }
      } catch {}
    }
  }
  return data
}

// Get cast and crew for a title
export async function getCredits(id, type) {
  return tmdb(`/${type}/${id}/credits`)
}

// Get all seasons for a TV show
export async function getSeasons(showId) {
  const show = await tmdb(`/tv/${showId}`)
  return (show.seasons || []).filter(s => s.season_number > 0)
}

// Get franchise/collection connections for a title
export async function getRelated(id, type) {
  if (type === 'movie') {
    try {
      const details = await tmdb(`/movie/${id}`)
      if (details?.belongs_to_collection?.id) {
        const collection = await tmdb(`/collection/${details.belongs_to_collection.id}`)
        const parts = (collection.parts || [])
          .filter(p => Number(p.id) !== Number(id))
          .sort((a, b) => (a.release_date || '').localeCompare(b.release_date || ''))
          .map(p => ({ ...p, media_type: 'movie' }))
        return { parts, collectionName: collection.name, collectionId: details.belongs_to_collection.id }
      }
      return { parts: [], collectionName: null, collectionId: null }
    } catch (e) {
      return { parts: [], collectionName: null, collectionId: null }
    }
  } else {
    return { parts: [], collectionName: null, collectionId: null }
  }
}

// Fetch a full TMDB collection by ID
export async function getCollection(collectionId) {
  try {
    const data = await tmdb(`/collection/${collectionId}`)
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
