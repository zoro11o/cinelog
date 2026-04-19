// ─── SearchPage with community ratings + favorites ─────────

import { useState, useEffect, useCallback } from 'react'
import { searchMulti, discoverMovies, discoverTV, getMovieGenres, getTVGenres, TMDB_IMAGE_BASE } from '../lib/tmdb'
import { STATUS_COLORS, STATUS_LABELS } from '../lib/constants'
import { useDebounce } from '../hooks/useDebounce'
import { fetchRatings } from '../hooks/useCommunityRatings'
import AddToListModal from '../components/modals/AddToListModal'
import HeartButton from '../components/ui/HeartButton'

const SORT_OPTIONS_MOVIE = [
  { value: 'popularity.desc',       label: 'Most Popular' },
  { value: 'popularity.asc',        label: 'Least Popular' },
  { value: 'community_rating.desc', label: '♥ Community Rating' },
  { value: 'vote_average.desc',     label: 'Highest TMDB Rating' },
  { value: 'vote_average.asc',      label: 'Lowest TMDB Rating' },
  { value: 'release_date.desc',     label: 'Newest First' },
  { value: 'release_date.asc',      label: 'Oldest First' },
  { value: 'revenue.desc',          label: 'Highest Revenue' },
]
const SORT_OPTIONS_TV = [
  { value: 'popularity.desc',       label: 'Most Popular' },
  { value: 'popularity.asc',        label: 'Least Popular' },
  { value: 'community_rating.desc', label: '♥ Community Rating' },
  { value: 'vote_average.desc',     label: 'Highest TMDB Rating' },
  { value: 'vote_average.asc',      label: 'Lowest TMDB Rating' },
  { value: 'first_air_date.desc',   label: 'Newest First' },
  { value: 'first_air_date.asc',    label: 'Oldest First' },
]

const COMMON_LANGUAGES = [
  { code: 'en', name: 'English' }, { code: 'hi', name: 'Hindi' },
  { code: 'ko', name: 'Korean' },  { code: 'ja', name: 'Japanese' },
  { code: 'es', name: 'Spanish' }, { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },  { code: 'zh', name: 'Chinese' },
  { code: 'ta', name: 'Tamil' },   { code: 'te', name: 'Telugu' },
  { code: 'ml', name: 'Malayalam'},{ code: 'pt', name: 'Portuguese' },
  { code: 'it', name: 'Italian' }, { code: 'ru', name: 'Russian' },
  { code: 'tr', name: 'Turkish' }, { code: 'ar', name: 'Arabic' },
]

const COUNTRIES = [
  { code: 'US', name: 'United States' }, { code: 'GB', name: 'United Kingdom' },
  { code: 'JP', name: 'Japan' },         { code: 'KR', name: 'South Korea' },
  { code: 'IN', name: 'India' },         { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },       { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },         { code: 'CN', name: 'China' },
  { code: 'AU', name: 'Australia' },     { code: 'CA', name: 'Canada' },
  { code: 'BR', name: 'Brazil' },        { code: 'MX', name: 'Mexico' },
  { code: 'RU', name: 'Russia' },        { code: 'TH', name: 'Thailand' },
  { code: 'TR', name: 'Turkey' },        { code: 'HK', name: 'Hong Kong' },
  { code: 'SE', name: 'Sweden' },        { code: 'DK', name: 'Denmark' },
]

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 80 }, (_, i) => CURRENT_YEAR - i)

const selectStyle = {
  padding: '8px 12px', background: '#161b22', border: '1px solid #30363d',
  borderRadius: 8, color: '#e6edf3', fontSize: 13, outline: 'none', cursor: 'pointer',
}

export default function SearchPage({ userId, entries, upsertEntry, removeEntry, favorites, toggleFavorite, isFavorite }) {
  const [query,       setQuery]       = useState('')
  const [results,     setResults]     = useState([])
  const [searching,   setSearching]   = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [selected,    setSelected]    = useState(null)
  const [showFilter,  setShowFilter]  = useState(false)
  const [genres,      setGenres]      = useState([])
  const [page,        setPage]        = useState(1)
  const [totalPages,  setTotalPages]  = useState(1)
  const [communityRatings, setCommunityRatings] = useState({})

  // Filters
  const [mediaType,  setMediaType]  = useState('all')
  const [sortBy,     setSortBy]     = useState('popularity.desc')
  const [year,       setYear]       = useState('')
  const [language,   setLanguage]   = useState('')
  const [genreId,    setGenreId]    = useState('')
  const [minRating,  setMinRating]  = useState('')
  const [country,    setCountry]    = useState('')

  const debouncedQuery = useDebounce(query, 400)
  const isFiltering    = mediaType !== 'all' || year || language || genreId || minRating || country

  useEffect(() => { setPage(1); setResults([]) }, [debouncedQuery, mediaType, sortBy, year, language, genreId, minRating, country])
  useEffect(() => {
    if (mediaType === 'tv') getTVGenres().then(setGenres).catch(() => {})
    else getMovieGenres().then(setGenres).catch(() => {})
  }, [mediaType])

  useEffect(() => { setSearching(true); doSearch(1, true) }, [debouncedQuery, mediaType, sortBy, year, language, genreId, minRating, country])

  // Global handler for opening modal from seasons/related
  useEffect(() => {
    window._watchvault_open_item = item => setSelected(item)
    return () => { delete window._watchvault_open_item }
  }, [])

  // Fetch community ratings whenever results change
  useEffect(() => {
    if (!results.length) return
    const ids = results.map(r => String(r.id))
    fetchRatings(ids).then(setCommunityRatings)
  }, [results])

  async function doSearch(pageNum, replace = false) {
    const isCommunitySort = sortBy === 'community_rating.desc'

    try {
      let allResults = []
      let totalPgs   = 1

      if (debouncedQuery.trim()) {
        // ── Text search mode ────────────────────────────────────
        // Use TMDB search (most accurate for queries), then filter/sort client-side
        // Run movie and TV search in parallel for speed
        const [movieSearch, tvSearch] = await Promise.allSettled([
          (mediaType === 'all' || mediaType === 'movie')
            ? searchMulti(debouncedQuery, {}, pageNum)
            : Promise.resolve({ results: [], totalPages: 1 }),
          Promise.resolve({ results: [], totalPages: 1 }), // handled by searchMulti
        ])

        // searchMulti already returns both movie+tv interleaved
        const raw = mediaType === 'all' || (!debouncedQuery)
          ? (movieSearch.status === 'fulfilled' ? movieSearch.value.results || [] : [])
          : (movieSearch.status === 'fulfilled' ? movieSearch.value.results || [] : [])

        totalPgs = movieSearch.status === 'fulfilled' ? movieSearch.value.totalPages || 1 : 1

        // Filter by type
        let filtered = raw
        if (mediaType === 'movie') filtered = raw.filter(r => r.media_type === 'movie')
        if (mediaType === 'tv')    filtered = raw.filter(r => r.media_type === 'tv')

        // Filter by year
        if (year) {
          filtered = filtered.filter(r => {
            const d = r.release_date || r.first_air_date || ''
            return d.startsWith(String(year))
          })
        }

        // Filter by language
        if (language) filtered = filtered.filter(r => r.original_language === language)

        // Filter by min rating
        if (minRating) filtered = filtered.filter(r => (r.vote_average || 0) >= Number(minRating))

        // Sort client-side
        if (!isCommunitySort) {
          if (sortBy === 'vote_average.desc')    filtered.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
          else if (sortBy === 'vote_average.asc') filtered.sort((a, b) => (a.vote_average || 0) - (b.vote_average || 0))
          else if (sortBy === 'release_date.desc' || sortBy === 'first_air_date.desc')
            filtered.sort((a, b) => (b.release_date || b.first_air_date || '').localeCompare(a.release_date || a.first_air_date || ''))
          else if (sortBy === 'release_date.asc' || sortBy === 'first_air_date.asc')
            filtered.sort((a, b) => (a.release_date || a.first_air_date || '').localeCompare(b.release_date || b.first_air_date || ''))
          else if (sortBy === 'popularity.desc')  filtered.sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
          else if (sortBy === 'popularity.asc')   filtered.sort((a, b) => (a.popularity || 0) - (b.popularity || 0))
        }

        allResults = filtered

      } else {
        // ── Browse/filter mode (no query) ───────────────────────
        // Use discover which fully supports sort_by, filters etc
        const discoverFilters = {}
        if (!isCommunitySort && sortBy) discoverFilters.sort_by = sortBy
        else if (isCommunitySort)       discoverFilters.sort_by = 'popularity.desc'
        if (language)  discoverFilters.with_original_language = language
        if (genreId)   discoverFilters.with_genres            = genreId
        if (minRating) discoverFilters['vote_average.gte']    = minRating
        if (country)   discoverFilters.with_origin_country    = country
        if (year) {
          discoverFilters.primary_release_year = year
          discoverFilters.first_air_date_year  = year
        }

        if (mediaType === 'movie') {
          const d = await discoverMovies(discoverFilters, pageNum)
          allResults = d.results || []; totalPgs = d.totalPages || 1
        } else if (mediaType === 'tv') {
          const tvF = { ...discoverFilters }
          if (tvF.sort_by?.includes('release_date')) tvF.sort_by = tvF.sort_by.replace('release_date', 'first_air_date')
          delete tvF.primary_release_year
          const d = await discoverTV(tvF, pageNum)
          allResults = d.results || []; totalPgs = d.totalPages || 1
        } else {
          // All — run both discover endpoints
          const movieF = { ...discoverFilters }; delete movieF.first_air_date_year
          const tvF    = { ...discoverFilters }; delete tvF.primary_release_year
          if (tvF.sort_by?.includes('release_date')) tvF.sort_by = tvF.sort_by.replace('release_date', 'first_air_date')
          const [m, t] = await Promise.allSettled([
            discoverMovies(movieF, pageNum),
            discoverTV(tvF, pageNum),
          ])
          const mr = m.status === 'fulfilled' ? m.value.results || [] : []
          const tr = t.status === 'fulfilled' ? t.value.results || [] : []
          const combined = []; const max = Math.max(mr.length, tr.length)
          for (let i = 0; i < max; i++) { if (mr[i]) combined.push(mr[i]); if (tr[i]) combined.push(tr[i]) }
          allResults = combined
          totalPgs   = Math.max(
            m.status === 'fulfilled' ? m.value.totalPages : 1,
            t.status === 'fulfilled' ? t.value.totalPages : 1,
          )
        }
      }

      // ── Community rating sort (always client-side) ─────────
      if (isCommunitySort && allResults.length > 0) {
        const ids      = allResults.map(r => String(r.id))
        const cRatings = await fetchRatings(ids)
        setCommunityRatings(prev => ({ ...prev, ...cRatings }))
        allResults = [...allResults].sort((a, b) =>
          parseFloat(cRatings[String(b.id)]?.avg || 0) - parseFloat(cRatings[String(a.id)]?.avg || 0)
        )
      }

      setResults(prev => replace ? allResults : [...prev, ...allResults])
      setTotalPages(totalPgs)

    } catch (e) {
      console.error('Search error:', e)
    } finally {
      setSearching(false)
      setLoadingMore(false)
    }
  }
  async function loadMore() {
    const next = page + 1; setPage(next); setLoadingMore(true); await doSearch(next, false)
  }

  function getExisting(item) {
    return entries.find(e => String(e.tmdb_id) === String(item.id) && e.media_type === item.media_type)
  }

  function clearFilters() {
    setMediaType('all'); setSortBy('popularity.desc')
    setYear(''); setLanguage(''); setGenreId(''); setMinRating(''); setCountry('')
  }

  const activeFilterCount = [mediaType !== 'all', year, language, genreId, minRating, country, sortBy !== 'popularity.desc'].filter(Boolean).length
  const sortOptions = mediaType === 'tv' ? SORT_OPTIONS_TV : SORT_OPTIONS_MOVIE

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>
      <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, marginBottom: 24 }}>
        Search Movies &amp; TV Shows
      </h2>

      {/* Search bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input autoFocus placeholder="Search for a movie or TV show…" value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ width: '100%', padding: '13px 18px', background: '#161b22', border: '1px solid #30363d', borderRadius: 10, color: '#e6edf3', fontSize: 15, outline: 'none' }} />
          {searching && <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#6e7681', fontSize: 13 }}>Searching…</span>}
        </div>
        <button onClick={() => setShowFilter(f => !f)} style={{
          padding: '13px 18px', borderRadius: 10, fontSize: 14, fontWeight: 500,
          background: showFilter ? '#22c55e22' : '#161b22',
          border: `1px solid ${showFilter ? '#22c55e' : '#30363d'}`,
          color: showFilter ? '#22c55e' : '#8b949e',
          display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
        }}>
          Filters {activeFilterCount > 0 && (
            <span style={{ background: '#22c55e', color: '#0d1117', borderRadius: '50%', width: 18, height: 18, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter panel */}
      {showFilter && (
        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: '#6e7681', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Type</div>
              <div style={{ display: 'flex', background: '#0d1117', borderRadius: 8, overflow: 'hidden', border: '1px solid #21262d' }}>
                {['all','movie','tv'].map(t => (
                  <button key={t} onClick={() => { setMediaType(t); setGenreId('') }}
                    style={{ padding: '7px 14px', fontSize: 13, background: mediaType === t ? '#21262d' : 'transparent', color: mediaType === t ? '#e6edf3' : '#6e7681' }}>
                    {t === 'all' ? 'All' : t === 'movie' ? 'Movies' : 'TV Shows'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#6e7681', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Sort By</div>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={selectStyle}>
                {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#6e7681', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Year</div>
              <select value={year} onChange={e => setYear(e.target.value)} style={selectStyle}>
                <option value="">Any Year</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#6e7681', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Language</div>
              <select value={language} onChange={e => setLanguage(e.target.value)} style={selectStyle}>
                <option value="">Any Language</option>
                {COMMON_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#6e7681', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Country</div>
              <select value={country} onChange={e => setCountry(e.target.value)} style={selectStyle}>
                <option value="">Any Country</option>
                {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </div>
            {genres.length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: '#6e7681', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Genre</div>
                <select value={genreId} onChange={e => setGenreId(e.target.value)} style={selectStyle}>
                  <option value="">Any Genre</option>
                  {genres.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
            )}
            <div>
              <div style={{ fontSize: 11, color: '#6e7681', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Min TMDB Rating</div>
              <select value={minRating} onChange={e => setMinRating(e.target.value)} style={selectStyle}>
                <option value="">Any Rating</option>
                {[9,8,7,6,5].map(r => <option key={r} value={r}>{r}+ / 10</option>)}
              </select>
            </div>
          </div>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} style={{ fontSize: 13, color: '#f87171', padding: 0 }}>Clear all filters</button>
          )}
        </div>
      )}

      {/* Results grid */}
      {results.length > 0 && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 16 }}>
            {results.map((item, idx) => {
              const existing  = getExisting(item)
              const title     = item.title || item.name
              const yr        = (item.release_date || item.first_air_date || '').slice(0, 4)
              const tmdbRating = item.vote_average ? item.vote_average.toFixed(1) : null
              const community  = communityRatings[String(item.id)]
              const isFav      = isFavorite(item.id, item.media_type)
              return (
                <div key={`${item.media_type}-${item.id}-${idx}`}
                  style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 10, overflow: 'hidden', cursor: 'pointer', position: 'relative', transition: 'transform 0.15s, border-color 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = '#22c55e55' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = '#21262d' }}
                >
                  <div onClick={() => setSelected(item)} style={{ display: 'contents' }}>
                    {item.poster_path
                      ? <img src={`${TMDB_IMAGE_BASE}${item.poster_path}`} alt={title} style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', display: 'block' }} />
                      : <div style={{ width: '100%', aspectRatio: '2/3', background: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#30363d', fontSize: 12, padding: 8, textAlign: 'center' }}>{title}</div>
                    }
                  </div>

                  {/* Heart button */}
                  <div style={{ position: 'absolute', top: 6, right: 6 }}>
                    <HeartButton isFav={isFav} onToggle={() => toggleFavorite({ ...item, media_type: item.media_type })} size={26} />
                  </div>

                  {/* Status badge */}
                  {existing && (
                    <div style={{ position: 'absolute', top: 6, left: 6, background: STATUS_COLORS[existing.status], borderRadius: 4, padding: '2px 6px', fontSize: 10, fontWeight: 600, color: '#fff' }}>
                      {STATUS_LABELS[existing.status].split(' ')[0].toUpperCase()}
                    </div>
                  )}

                  <div onClick={() => setSelected(item)} style={{ padding: '8px 10px 12px', cursor: 'pointer' }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#e6edf3', lineHeight: 1.3, marginBottom: 4 }}>
                      {title.length > 28 ? title.slice(0, 26) + '…' : title}
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: tmdbRating || community ? 4 : 0 }}>
                      <span style={{ fontSize: 11, color: '#6e7681' }}>{yr}</span>
                      <span style={{ fontSize: 10, background: '#21262d', color: '#8b949e', borderRadius: 3, padding: '1px 5px', fontWeight: 600 }}>
                        {item.media_type === 'movie' ? 'MOVIE' : 'TV'}
                      </span>
                    </div>
                    {/* Ratings — TMDB yellow + community green */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      {tmdbRating && (
                        <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>★ {tmdbRating}</span>
                      )}
                      {community ? (
                        <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 700 }}>
                          ♥ {community.avg}<span style={{ color: '#6e7681', fontWeight: 400, fontSize: 10 }}> ({community.count})</span>
                        </span>
                      ) : (
                        <span style={{ fontSize: 10, color: '#30363d' }}>♥ —</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {page < totalPages && (
            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <button onClick={loadMore} disabled={loadingMore} style={{ padding: '12px 32px', borderRadius: 10, background: 'transparent', border: '1px solid #30363d', color: '#e6edf3', fontSize: 14, fontWeight: 500, opacity: loadingMore ? 0.6 : 1, cursor: loadingMore ? 'default' : 'pointer' }}>
                {loadingMore ? 'Loading…' : `Load More (Page ${page + 1} of ${totalPages})`}
              </button>
            </div>
          )}
        </>
      )}

      {!searching && results.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#6e7681' }}>
          <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.2 }}>⟡</div>
          <p>No results found</p>
        </div>
      )}

      {selected && (
        <AddToListModal item={selected} userId={userId} existingEntry={getExisting(selected)}
          onClose={() => setSelected(null)}
          onSave={async payload => { await upsertEntry(payload); setSelected(null) }}
          onRemove={async id => { await removeEntry(id); setSelected(null) }} />
      )}
    </div>
  )
}
