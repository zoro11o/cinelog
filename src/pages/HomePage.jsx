// ─── HomePage ──────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { discoverMovies, discoverTV, TMDB_IMAGE_BASE, getCollection } from '../lib/tmdb'
import { STATUS_COLORS, STATUS_LABELS } from '../lib/constants'
import AddToListModal from '../components/modals/AddToListModal'
import HeartButton    from '../components/ui/HeartButton'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const FEATURED_COLLECTIONS = [
  { id: 263,    name: 'The Dark Knight Trilogy' },
  { id: 9485,   name: 'Fast & Furious' },
  { id: 86311,  name: 'The Avengers' },
  { id: 86254,  name: 'The Conjuring' },
  { id: 645,    name: 'James Bond' },
  { id: 2150,   name: 'John Wick' },
  { id: 131295, name: 'Jurassic Park' },
  { id: 10,     name: 'Star Wars' },
  { id: 1241,   name: 'Harry Potter' },
  { id: 87359,  name: 'Mission: Impossible' },
  { id: 33514,  name: 'Transformers' },
  { id: 748,    name: 'The Godfather' },
]

// ── Reusable poster card ────────────────────────────────────
function PosterCard({ item, mediaType, entries, isFavorite, toggleFavorite, onOpen }) {
  const t        = item.title || item.name
  const yr       = (item.release_date || item.first_air_date || '').slice(0, 4)
  const date     = item.release_date || item.first_air_date || ''
  const upcoming = date && new Date(date) > new Date()
  const existing = entries?.find(e => String(e.tmdb_id) === String(item.id) && e.media_type === mediaType)
  const isFav    = isFavorite?.(item.id, mediaType)

  return (
    <div style={{ flexShrink: 0, width: 130, cursor: 'pointer' }}>
      <div
        onClick={() => onOpen({ ...item, media_type: mediaType })}
        style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', marginBottom: 6, transition: 'opacity 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
      >
        {item.poster_path
          ? <img src={`${TMDB_IMAGE_BASE}${item.poster_path}`} alt={t}
              style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', display: 'block' }} />
          : <div style={{ width: '100%', aspectRatio: '2/3', background: '#161b22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#6e7681', padding: 6, textAlign: 'center' }}>{t}</div>
        }

        {/* Status badge */}
        {existing && (
          <div style={{ position: 'absolute', top: 6, left: 6, background: STATUS_COLORS[existing.status], borderRadius: 4, padding: '2px 6px', fontSize: 9, fontWeight: 700, color: '#fff' }}>
            {STATUS_LABELS[existing.status].split(' ')[0].toUpperCase()}
          </div>
        )}

        {/* TMDB rating */}
        {item.vote_average > 0 && (
          <div style={{ position: 'absolute', top: existing ? 28 : 6, left: 6, background: 'rgba(0,0,0,0.8)', borderRadius: 4, padding: '2px 5px', fontSize: 10, fontWeight: 600, color: '#f59e0b' }}>
            ★ {item.vote_average.toFixed(1)}
          </div>
        )}

        {/* User score */}
        {existing?.score && (
          <div style={{ position: 'absolute', bottom: 6, left: 6, background: 'rgba(0,0,0,0.8)', borderRadius: 4, padding: '2px 5px', fontSize: 10, fontWeight: 600, color: '#c9a84c' }}>
            {existing.score}/10
          </div>
        )}

        {/* Heart */}
        {toggleFavorite && (
          <div style={{ position: 'absolute', top: 5, right: 5 }} onClick={e => { e.stopPropagation(); toggleFavorite({ ...item, media_type: mediaType }) }}>
            <HeartButton isFav={isFav} onToggle={() => {}} size={24} />
          </div>
        )}

        {/* Upcoming date badge */}
        {upcoming && date && (
          <div style={{ position: 'absolute', bottom: 6, right: 6, background: 'rgba(0,0,0,0.8)', borderRadius: 4, padding: '2px 5px', fontSize: 9, fontWeight: 600, color: '#c9a84c' }}>
            {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
        )}
      </div>

      <div onClick={() => onOpen({ ...item, media_type: mediaType })}
        style={{ fontSize: 12, fontWeight: 500, color: '#e6edf3', lineHeight: 1.3, marginBottom: 2 }}>
        {t?.length > 22 ? t.slice(0, 20) + '…' : t}
      </div>
      <div style={{ fontSize: 11, color: '#6e7681' }}>{yr}</div>
    </div>
  )
}

// ── Horizontal scrolling row ────────────────────────────────
function PosterRow({ title, badge, items, entries, isFavorite, toggleFavorite, onOpen }) {
  if (!items.length) return null
  return (
    <div style={{ marginBottom: 44 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, paddingLeft: 24 }}>
        <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: '#e6edf3' }}>{title}</h3>
        {badge && <span style={{ fontSize: 11, background: '#22c55e22', color: '#22c55e', borderRadius: 20, padding: '2px 10px', border: '1px solid #22c55e33', fontWeight: 600 }}>{badge}</span>}
      </div>
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingLeft: 24, paddingRight: 24, paddingBottom: 8, scrollbarWidth: 'thin', scrollbarColor: '#30363d transparent' }}>
        {items.map(item => {
          const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie')
          return (
            <PosterCard key={item.id} item={item} mediaType={mediaType}
              entries={entries} isFavorite={isFavorite} toggleFavorite={toggleFavorite} onOpen={onOpen} />
          )
        })}
      </div>
    </div>
  )
}

// ── Franchise collection browser ────────────────────────────
function CollectionRow({ entries, isFavorite, toggleFavorite, onOpen }) {
  const [activeCollection, setActiveCollection] = useState(null)
  const [loadingId,        setLoadingId]        = useState(null)

  async function handleCollectionClick(col) {
    if (activeCollection?.id === col.id) { setActiveCollection(null); return }
    setLoadingId(col.id)
    const data = await getCollection(col.id)
    if (data) setActiveCollection({ ...data, id: col.id })
    setLoadingId(null)
  }

  return (
    <div style={{ marginBottom: 44 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, paddingLeft: 24 }}>
        <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: '#e6edf3' }}>Browse Franchises</h3>
        <span style={{ fontSize: 11, background: '#8b5cf622', color: '#8b5cf6', borderRadius: 20, padding: '2px 10px', border: '1px solid #8b5cf633', fontWeight: 600 }}>Collections</span>
      </div>

      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingLeft: 24, paddingRight: 24, paddingBottom: 8, scrollbarWidth: 'thin', scrollbarColor: '#30363d transparent', marginBottom: activeCollection ? 20 : 0 }}>
        {FEATURED_COLLECTIONS.map(col => (
          <button key={col.id} onClick={() => handleCollectionClick(col)} style={{
            flexShrink: 0, padding: '10px 18px',
            background: activeCollection?.id === col.id ? '#8b5cf622' : '#161b22',
            border: `1px solid ${activeCollection?.id === col.id ? '#8b5cf6' : '#21262d'}`,
            borderRadius: 20, color: activeCollection?.id === col.id ? '#8b5cf6' : '#e6edf3',
            fontSize: 13, fontWeight: 500, cursor: loadingId === col.id ? 'wait' : 'pointer',
            whiteSpace: 'nowrap', transition: 'all 0.15s',
          }}>
            {loadingId === col.id ? 'Loading…' : col.name}
          </button>
        ))}
      </div>

      {activeCollection && (
        <div style={{ paddingLeft: 24, paddingRight: 24 }}>
          <p style={{ fontSize: 13, color: '#8b5cf6', marginBottom: 14, fontWeight: 500 }}>
            {activeCollection.name} · {activeCollection.parts.length} films
          </p>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'thin', scrollbarColor: '#30363d transparent' }}>
            {activeCollection.parts.map(item => (
              <PosterCard key={item.id} item={item} mediaType="movie"
                entries={entries} isFavorite={isFavorite} toggleFavorite={toggleFavorite} onOpen={onOpen} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main HomePage ───────────────────────────────────────────
export default function HomePage({ onNav, userId, entries, upsertEntry, removeEntry, isFavorite, toggleFavorite }) {
  const [newMovies,      setNewMovies]      = useState([])
  const [newTV,          setNewTV]          = useState([])
  const [upcomingMovies, setUpcomingMovies] = useState([])
  const [popularPicks,   setPopularPicks]   = useState([])
  const [topRated,       setTopRated]       = useState([])
  const [selected,       setSelected]       = useState(null)

  useEffect(() => {
    const today            = new Date().toISOString().slice(0, 10)
    const threeMonthsAgo   = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const threeMonthsAhead = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

    discoverMovies({ sort_by: 'popularity.desc', 'primary_release_date.gte': threeMonthsAgo, 'primary_release_date.lte': today })
      .then(d => setNewMovies(d.results || [])).catch(() => {})

    discoverTV({ sort_by: 'popularity.desc', 'first_air_date.gte': threeMonthsAgo, 'first_air_date.lte': today })
      .then(d => setNewTV(d.results || [])).catch(() => {})

    discoverMovies({ sort_by: 'popularity.desc', 'primary_release_date.gte': today, 'primary_release_date.lte': threeMonthsAhead })
      .then(d => setUpcomingMovies(d.results || [])).catch(() => {})

    discoverMovies({ sort_by: 'popularity.desc', 'vote_count.gte': 1000, 'vote_average.gte': 7 })
      .then(d => setPopularPicks(shuffle(d.results || []).slice(0, 20))).catch(() => {})

    discoverMovies({ sort_by: 'vote_average.desc', 'vote_count.gte': 5000 })
      .then(d => setTopRated(d.results || [])).catch(() => {})
  }, [])

  const sharedProps = { entries, isFavorite, toggleFavorite, onOpen: setSelected }

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', background: 'radial-gradient(ellipse at 50% 0%, #1a2332 0%, #0d1117 60%)' }}>

      {/* Hero */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 24px 60px', textAlign: 'center' }}>
        <div style={{ maxWidth: 560 }}>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 52, color: '#c9a84c', marginBottom: 16, lineHeight: 1.1 }}>
            Your personal<br />watch history
          </h1>
          <p style={{ fontSize: 18, color: '#8b949e', marginBottom: 36, lineHeight: 1.6 }}>
            Track every movie and TV show, follow friends, and discover what to watch next.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={() => onNav('search')} style={{ padding: '13px 28px', background: '#c9a84c', color: '#0d1117', borderRadius: 10, fontWeight: 600, fontSize: 16, border: 'none', cursor: 'pointer' }}>
              Start Tracking
            </button>
            <button onClick={() => onNav('mylist')} style={{ padding: '13px 28px', border: '1px solid #30363d', color: '#e6edf3', borderRadius: 10, fontSize: 16, background: 'transparent', cursor: 'pointer' }}>
              My List
            </button>
          </div>
          <div style={{ display: 'flex', gap: 32, justifyContent: 'center', marginTop: 48 }}>
            {[['Movies', 'Track films'], ['TV Shows', 'Episode progress'], ['Stats', 'See your habits']].map(([t, s]) => (
              <div key={t}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 2, color: '#e6edf3' }}>{t}</div>
                <div style={{ fontSize: 13, color: '#6e7681' }}>{s}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ height: 1, background: '#21262d', marginBottom: 44 }} />

      <PosterRow title="Popular Picks"       badge="Refreshes every visit" items={popularPicks}   {...sharedProps} />
      <PosterRow title="New Movie Releases"                                items={newMovies}       {...sharedProps} />
      <PosterRow title="New TV Shows"                                      items={newTV}           {...sharedProps} />
      <PosterRow title="Top Rated All Time"                                items={topRated}        {...sharedProps} />
      <PosterRow title="Upcoming Movies"                                   items={upcomingMovies}  {...sharedProps} />
      <CollectionRow {...sharedProps} />

      <div style={{ height: 48 }} />

      {selected && (
        <AddToListModal
          item={selected}
          userId={userId}
          existingEntry={entries?.find(e => String(e.tmdb_id) === String(selected.id) && e.media_type === selected.media_type)}
          onClose={() => setSelected(null)}
          onSave={async payload => { await upsertEntry?.(payload); setSelected(null) }}
          onRemove={async id => { await removeEntry?.(id); setSelected(null) }}
          isFavorite={isFavorite}
          toggleFavorite={toggleFavorite}
        />
      )}
    </div>
  )
}
