// ─── SearchPage — AniList-style advanced search ────────────

import { useState, useEffect } from 'react'
import {
  searchMulti, searchPerson, discoverMovies, discoverTV,
  getTrending, getMovieGenres, getTVGenres, TMDB_IMAGE_BASE
} from '../lib/tmdb'
import { STATUS_COLORS, STATUS_LABELS } from '../lib/constants'
import { useDebounce } from '../hooks/useDebounce'
import { fetchRatings } from '../hooks/useCommunityRatings'
import AddToListModal from '../components/modals/AddToListModal'
import MiniCard       from '../components/ui/MiniCard'
import HeartButton    from '../components/ui/HeartButton'


const SORT_OPTIONS = [
  { value: 'trending',              label: '🔥 Trending' },
  { value: 'popularity.desc',       label: '📈 Most Popular' },
  { value: 'popularity.asc',        label: '📉 Least Popular' },
  { value: 'vote_average.desc',     label: '⭐ Highest Rated' },
  { value: 'vote_count.desc',       label: '🗳️ Most Voted' },
  { value: 'community_rating.desc', label: '♥ Community Rating' },
  { value: 'release_date.desc',     label: '🆕 Newest First' },
  { value: 'release_date.asc',      label: '📅 Oldest First' },
  { value: 'title.asc',             label: '🔤 Title A–Z' },
  { value: 'title.desc',            label: '🔤 Title Z–A' },
  { value: 'revenue.desc',          label: '💰 Highest Revenue' },
]

// Maps our sort values to TMDB discover sort_by values
const SORT_TO_TMDB = {
  'trending':              'popularity.desc',
  'popularity.desc':       'popularity.desc',
  'popularity.asc':        'popularity.asc',
  'vote_average.desc':     'vote_average.desc',
  'vote_count.desc':       'vote_count.desc',
  'community_rating.desc': 'popularity.desc',
  'release_date.desc':     'release_date.desc',
  'release_date.asc':      'release_date.asc',
  'title.asc':             'title.asc',
  'title.desc':            'title.desc',
  'revenue.desc':          'revenue.desc',
}

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
  padding: '8px 12px', background: '#0d1117', border: '1px solid #30363d',
  borderRadius: 8, color: '#e6edf3', fontSize: 13, outline: 'none', cursor: 'pointer',
}

function Pill({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: active ? 600 : 400,
      border: `1px solid ${active ? '#22c55e' : '#30363d'}`,
      background: active ? '#22c55e22' : 'transparent',
      color: active ? '#22c55e' : '#8b949e',
      cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
    }}>
      {label}
    </button>
  )
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
  const [mediaType, setMediaType] = useState('all')
  const [sortBy,    setSortBy]    = useState('trending')
  const [year,      setYear]      = useState('')
  const [language,  setLanguage]  = useState('')
  const [genreIds,  setGenreIds]  = useState([])
  const [minRating, setMinRating] = useState('')
  const [country,   setCountry]   = useState('')

  const debouncedQuery  = useDebounce(query, 400)
  const isPeopleMode    = mediaType === 'people'
  const isTrending      = sortBy === 'trending'
  const isCommunitySort = sortBy === 'community_rating.desc'

  useEffect(() => { setPage(1); setResults([]) }, [debouncedQuery, mediaType, sortBy, year, language, genreIds, minRating, country])

  useEffect(() => {
    if (isPeopleMode) return
    if (mediaType === 'tv') getTVGenres().then(setGenres).catch(() => {})
    else getMovieGenres().then(setGenres).catch(() => {})
  }, [mediaType])

  useEffect(() => { setSearching(true); doSearch(1, true) }, [debouncedQuery, mediaType, sortBy, year, language, genreIds, minRating, country])

  useEffect(() => {
    window._watchvault_open_item = item => setSelected(item)
    return () => { delete window._watchvault_open_item }
  }, [])

  useEffect(() => {
    if (!results.length || isPeopleMode) return
    const ids = results.map(r => String(r.id))
    fetchRatings(ids).then(setCommunityRatings)
  }, [results])

  function toggleGenre(id) {
    setGenreIds(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id])
  }

  async function doSearch(pageNum, replace = false) {
    try {
      // ── People ──────────────────────────────────────────────
      if (isPeopleMode) {
        if (!debouncedQuery.trim()) {
          setResults([]); setTotalPages(1); setSearching(false); return
        }
        const { results: people, totalPages: tp } = await searchPerson(debouncedQuery, pageNum)
        setResults(prev => replace ? people : [...prev, ...people])
        setTotalPages(tp)
        setSearching(false); setLoadingMore(false)
        return
      }

      let allResults = []
      let totalPgs   = 1

      // ── Text search ─────────────────────────────────────────
      if (debouncedQuery.trim()) {
        const raw = await searchMulti(debouncedQuery, {}, pageNum)
        let filtered = raw.results || []
        totalPgs = raw.totalPages || 1

        if (mediaType === 'movie') filtered = filtered.filter(r => r.media_type === 'movie')
        if (mediaType === 'tv')    filtered = filtered.filter(r => r.media_type === 'tv')
        if (year)      filtered = filtered.filter(r => (r.release_date || r.first_air_date || '').startsWith(String(year)))
        if (language)  filtered = filtered.filter(r => r.original_language === language)
        if (minRating) filtered = filtered.filter(r => (r.vote_average || 0) >= Number(minRating))
        if (genreIds.length) {
          filtered = filtered.filter(r => genreIds.every(gid => (r.genre_ids || []).includes(Number(gid))))
        }

        if (!isCommunitySort) {
          if      (sortBy === 'vote_average.desc')                                     filtered.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
          else if (sortBy === 'vote_count.desc')                                       filtered.sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
          else if (sortBy === 'release_date.desc' || sortBy === 'first_air_date.desc') filtered.sort((a, b) => (b.release_date || b.first_air_date || '').localeCompare(a.release_date || a.first_air_date || ''))
          else if (sortBy === 'release_date.asc'  || sortBy === 'first_air_date.asc')  filtered.sort((a, b) => (a.release_date || a.first_air_date || '').localeCompare(b.release_date || b.first_air_date || ''))
          else if (sortBy === 'title.asc')   filtered.sort((a, b) => (a.title || a.name || '').localeCompare(b.title || b.name || ''))
          else if (sortBy === 'title.desc')  filtered.sort((a, b) => (b.title || b.name || '').localeCompare(a.title || a.name || ''))
          else if (sortBy === 'popularity.asc') filtered.sort((a, b) => (a.popularity || 0) - (b.popularity || 0))
          else filtered.sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
        }

        allResults = filtered

      // ── Trending (no query) ─────────────────────────────────
      } else if (isTrending) {
        const trendType = mediaType === 'movie' ? 'movie' : mediaType === 'tv' ? 'tv' : 'all'
        const { results: tr, totalPages: tp } = await getTrending(trendType, 'week', pageNum)
        let filtered = tr
        if (language)  filtered = filtered.filter(r => r.original_language === language)
        if (minRating) filtered = filtered.filter(r => (r.vote_average || 0) >= Number(minRating))
        if (genreIds.length) filtered = filtered.filter(r => genreIds.every(gid => (r.genre_ids || []).includes(Number(gid))))
        allResults = filtered; totalPgs = tp

      // ── Discover (no query, non-trending) ───────────────────
      } else {
        const tmdbSort = SORT_TO_TMDB[sortBy] || 'popularity.desc'

        const discoverFilters = {}
        if (!isCommunitySort) discoverFilters.sort_by = tmdbSort
        if (language)        discoverFilters.with_original_language = language
        if (minRating)       discoverFilters['vote_average.gte']    = minRating
        if (country)         discoverFilters.with_origin_country    = country
        if (genreIds.length) discoverFilters.with_genres            = genreIds.join(',')
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
          if (tvF.sort_by === 'title.asc')    tvF.sort_by = 'name.asc'
          if (tvF.sort_by === 'title.desc')   tvF.sort_by = 'name.desc'
          if (tvF.sort_by === 'revenue.desc') tvF.sort_by = 'popularity.desc'
          delete tvF.primary_release_year
          const d = await discoverTV(tvF, pageNum)
          allResults = d.results || []; totalPgs = d.totalPages || 1

        } else {
          const movieF = { ...discoverFilters }; delete movieF.first_air_date_year
          const tvF    = { ...discoverFilters }; delete tvF.primary_release_year
          if (tvF.sort_by?.includes('release_date')) tvF.sort_by = tvF.sort_by.replace('release_date', 'first_air_date')
          if (tvF.sort_by === 'title.asc')    tvF.sort_by = 'name.asc'
          if (tvF.sort_by === 'title.desc')   tvF.sort_by = 'name.desc'
          if (tvF.sort_by === 'revenue.desc') tvF.sort_by = 'popularity.desc'

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

      // ── Community rating sort ───────────────────────────────
      if (isCommunitySort && allResults.length) {
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
    setSortBy('trending'); setYear(''); setLanguage('')
    setGenreIds([]); setMinRating(''); setCountry('')
  }

  const activeFilterCount = [
    sortBy !== 'trending', year, language,
    genreIds.length > 0, minRating, country,
  ].filter(Boolean).length

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>
      <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, marginBottom: 20 }}>
        Search Movies, TV &amp; People
      </h2>

      {/* ── Search bar ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 0 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            autoFocus
            placeholder={isPeopleMode ? 'Search for an actor, director, writer…' : 'Search for a title…'}
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ width: '100%', padding: '13px 18px', background: '#161b22', border: '1px solid #30363d', borderRadius: 10, color: '#e6edf3', fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
          />
          {searching && (
            <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#6e7681', fontSize: 12 }}>
              Searching…
            </span>
          )}
        </div>
        {!isPeopleMode && (
          <button onClick={() => setShowFilter(f => !f)} style={{
            padding: '13px 18px', borderRadius: 10, fontSize: 14, fontWeight: 500,
            background: showFilter ? '#22c55e22' : '#161b22',
            border: `1px solid ${showFilter ? '#22c55e' : '#30363d'}`,
            color: showFilter ? '#22c55e' : '#8b949e',
            display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', cursor: 'pointer',
          }}>
            Filters
            {activeFilterCount > 0 && (
              <span style={{ background: '#22c55e', color: '#0d1117', borderRadius: '50%', width: 18, height: 18, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {activeFilterCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* ── Type tabs ── */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #21262d', marginTop: 16, marginBottom: 0 }}>
        {[
          { id: 'all',    label: 'All' },
          { id: 'movie',  label: 'Movies' },
          { id: 'tv',     label: 'TV Shows' },
          { id: 'people', label: '👤 People' },
        ].map(t => (
          <button key={t.id} onClick={() => { setMediaType(t.id); setShowFilter(false) }} style={{
            padding: '9px 18px', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap',
            color: mediaType === t.id ? '#22c55e' : '#6e7681',
            borderBottom: mediaType === t.id ? '2px solid #22c55e' : '2px solid transparent',
            background: 'transparent', border: 'none', cursor: 'pointer', marginBottom: -1,
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Filter panel ── */}
      {showFilter && !isPeopleMode && (
        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: 20, marginTop: 16 }}>

          {/* Row 1: dropdowns */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 11, color: '#6e7681', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Sort By</div>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={selectStyle}>
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
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
            <div>
              <div style={{ fontSize: 11, color: '#6e7681', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Min Rating</div>
              <select value={minRating} onChange={e => setMinRating(e.target.value)} style={selectStyle}>
                <option value="">Any</option>
                {[9,8,7,6,5].map(r => <option key={r} value={r}>{r}+ ★</option>)}
              </select>
            </div>
          </div>

          {/* Genre pills */}
          {genres.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: '#6e7681', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
                Genres
                {genreIds.length > 0 && (
                  <span style={{ marginLeft: 8, fontSize: 11, color: '#22c55e' }}>({genreIds.length} selected)</span>
                )}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {genres.map(g => (
                  <Pill key={g.id} label={g.name} active={genreIds.includes(g.id)} onClick={() => toggleGenre(g.id)} />
                ))}
              </div>
            </div>
          )}

          {activeFilterCount > 0 && (
            <button onClick={clearFilters} style={{ fontSize: 13, color: '#f87171', padding: 0, background: 'none', border: 'none', cursor: 'pointer', marginTop: 4 }}>
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* ── Active filter chips (when panel closed) ── */}
      {!showFilter && !isPeopleMode && activeFilterCount > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
          {sortBy !== 'trending' && (
            <span style={{ fontSize: 11, background: '#22c55e22', color: '#22c55e', borderRadius: 20, padding: '3px 10px', border: '1px solid #22c55e44' }}>
              {SORT_OPTIONS.find(s => s.value === sortBy)?.label}
            </span>
          )}
          {genreIds.map(id => {
            const g = genres.find(g => g.id === id)
            return g ? (
              <span key={id} onClick={() => toggleGenre(id)} style={{ fontSize: 11, background: '#22c55e22', color: '#22c55e', borderRadius: 20, padding: '3px 10px', border: '1px solid #22c55e44', cursor: 'pointer' }}>
                {g.name} ✕
              </span>
            ) : null
          })}
          {year      && <span style={{ fontSize: 11, background: '#3b82f622', color: '#3b82f6', borderRadius: 20, padding: '3px 10px', border: '1px solid #3b82f644' }}>{year}</span>}
          {language  && <span style={{ fontSize: 11, background: '#3b82f622', color: '#3b82f6', borderRadius: 20, padding: '3px 10px', border: '1px solid #3b82f644' }}>{COMMON_LANGUAGES.find(l => l.code === language)?.name}</span>}
          {country   && <span style={{ fontSize: 11, background: '#3b82f622', color: '#3b82f6', borderRadius: 20, padding: '3px 10px', border: '1px solid #3b82f644' }}>{COUNTRIES.find(c => c.code === country)?.name}</span>}
          {minRating && <span style={{ fontSize: 11, background: '#f59e0b22', color: '#f59e0b', borderRadius: 20, padding: '3px 10px', border: '1px solid #f59e0b44' }}>★ {minRating}+</span>}
          <button onClick={clearFilters} style={{ fontSize: 11, color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', padding: '3px 6px' }}>
            Clear all
          </button>
        </div>
      )}

      {/* ── People results ── */}
      {isPeopleMode && results.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 16, marginTop: 20 }}>
          {results.map(person => (
            <div key={`person-${person.id}`}
              onClick={() => window._watchvault_open_person?.(person.id)}
              style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 10, overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.15s, border-color 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = '#22c55e55' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = '#21262d' }}
            >
              {person.profile_path
                ? <img src={`${TMDB_IMAGE_BASE}${person.profile_path}`} alt={person.name}
                    style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', objectPosition: 'top', display: 'block' }} />
                : <div style={{ width: '100%', aspectRatio: '2/3', background: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, color: '#30363d' }}>
                    {person.name?.[0]}
                  </div>
              }
              <div style={{ padding: '8px 10px 10px' }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#e6edf3', lineHeight: 1.3, marginBottom: 4 }}>
                  {person.name?.length > 22 ? person.name.slice(0, 20) + '…' : person.name}
                </div>
                {person.known_for_department && (
                  <div style={{ fontSize: 11, color: '#22c55e', marginBottom: 4 }}>{person.known_for_department}</div>
                )}
                {person.known_for?.length > 0 && (
                  <div style={{ fontSize: 10, color: '#6e7681', lineHeight: 1.4 }}>
                    {person.known_for.slice(0, 2).map(k => k.title || k.name).join(', ')}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isPeopleMode && !searching && results.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#6e7681', marginTop: 16 }}>
          <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.2 }}>👤</div>
          <p style={{ fontSize: 15, marginBottom: 6 }}>Search for a person</p>
          <p style={{ fontSize: 13 }}>Type an actor, director, or writer's name above</p>
        </div>
      )}

      {/* ── Movie / TV results ── */}
      {!isPeopleMode && results.length > 0 && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 16, marginTop: 20 }}>
            {results.map((item, idx) => {
              const existing   = getExisting(item)
              const title      = item.title || item.name
              const yr         = (item.release_date || item.first_air_date || '').slice(0, 4)
              const tmdbRating = item.vote_average ? item.vote_average.toFixed(1) : null
              const community  = communityRatings[String(item.id)]
              const isFav      = isFavorite(item.id, item.media_type)
              return (
                <div key={`${item.media_type}-${item.id}-${idx}`}
                  style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 10, overflow: 'hidden', position: 'relative', transition: 'border-color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#22c55e55'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#21262d'}
                >
                  <MiniCard
                    item={{ ...item, media_type: item.media_type }}
                    userId={userId}
                    existingEntry={existing}
                    upsertEntry={upsertEntry}
                    removeEntry={removeEntry}
                  />
                  <div style={{ position: 'absolute', top: 6, left: 6 }}>
                    <HeartButton isFav={isFav} onToggle={() => toggleFavorite({ ...item, media_type: item.media_type })} size={24} />
                  </div>
                  <div onClick={() => setSelected(item)} style={{ padding: '6px 10px 10px', cursor: 'pointer' }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#e6edf3', lineHeight: 1.3, marginBottom: 3 }}>
                      {title.length > 28 ? title.slice(0, 26) + '…' : title}
                    </div>
                    <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: '#6e7681' }}>{yr}</span>
                      <span style={{ fontSize: 10, background: '#21262d', color: '#8b949e', borderRadius: 3, padding: '1px 5px', fontWeight: 600 }}>
                        {item.media_type === 'movie' ? 'MOVIE' : 'TV'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      {tmdbRating
                        ? <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>★ {tmdbRating}</span>
                        : <span />
                      }
                      {community
                        ? <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 700 }}>
                            ♥ {community.avg}
                            <span style={{ color: '#6e7681', fontWeight: 400, fontSize: 10 }}> ({community.count})</span>
                          </span>
                        : <span style={{ fontSize: 10, color: '#30363d' }}>♥ —</span>
                      }
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

      {!searching && !isPeopleMode && results.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#6e7681', marginTop: 16 }}>
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
