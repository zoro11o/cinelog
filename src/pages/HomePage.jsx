// ─── HomePage ──────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { discoverMovies, discoverTV, TMDB_IMAGE_BASE, getCollection } from '../lib/tmdb'
import AddToListModal from '../components/modals/AddToListModal'
import MiniCard       from '../components/ui/MiniCard'

// Shuffle array using Fisher-Yates
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Famous TMDB collection IDs for the franchise browser
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

function PosterRow({ title, items, badge, onClickItem, entries, isFavorite, toggleFavorite, userId, upsertEntry, removeEntry }) {
  if (!items.length) return null
  return (
    <div style={{ marginBottom: 44 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, paddingLeft: 24 }}>
        <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: '#e6edf3' }}>{title}</h3>
        {badge && <span style={{ fontSize: 11, background: '#22c55e22', color: '#22c55e', borderRadius: 20, padding: '2px 10px', border: '1px solid #22c55e33', fontWeight: 600 }}>{badge}</span>}
      </div>
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingLeft: 24, paddingRight: 24, paddingBottom: 8, scrollbarWidth: 'thin', scrollbarColor: '#30363d transparent' }}>
        {items.map(item => {
          const t          = item.title || item.name
          const yr         = (item.release_date || item.first_air_date || '').slice(0, 4)
          const date       = item.release_date || item.first_air_date || ''
          const isUpcoming = date && new Date(date) > new Date()
          const mediaType  = item.media_type || (item.first_air_date ? 'tv' : 'movie')
          const existing   = entries?.find(e => String(e.tmdb_id) === String(item.id) && e.media_type === mediaType)
          const isFav      = isFavorite?.(item.id, mediaType)
          return (
            <div key={item.id} style={{ flexShrink: 0, width: 130 }}>
              <MiniCard
                item={{ ...item, media_type: mediaType }}
                userId={userId}
                existingEntry={existing}
                upsertEntry={upsertEntry}
                removeEntry={removeEntry}
              />
              {isUpcoming && date && (
                <div style={{ fontSize: 10, color: '#c9a84c', textAlign: 'center', marginTop: 2, fontWeight: 600 }}>
                  {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              )}
              <div style={{ fontSize: 12, fontWeight: 500, color: '#e6edf3', lineHeight: 1.3, marginTop: 4, cursor: 'pointer' }}
                onClick={() => onClickItem?.({ ...item, media_type: mediaType })}>
                {t?.length > 22 ? t.slice(0, 20) + '…' : t}
              </div>
              <div style={{ fontSize: 11, color: '#6e7681' }}>{yr}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CollectionRow({ onClickItem, entries, isFavorite, toggleFavorite }) {
  const [activeCollection, setActiveCollection] = useState(null) // { name, parts }
  const [loadingId,        setLoadingId]        = useState(null)

  async function handleCollectionClick(col) {
    if (activeCollection?.id === col.id) {
      setActiveCollection(null); return
    }
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

      {/* Franchise pills */}
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingLeft: 24, paddingRight: 24, paddingBottom: 8, scrollbarWidth: 'thin', scrollbarColor: '#30363d transparent', marginBottom: activeCollection ? 20 : 0 }}>
        {FEATURED_COLLECTIONS.map(col => (
          <button key={col.id}
            onClick={() => handleCollectionClick(col)}
            style={{
              flexShrink: 0, padding: '10px 18px',
              background: activeCollection?.id === col.id ? '#8b5cf622' : '#161b22',
              border: `1px solid ${activeCollection?.id === col.id ? '#8b5cf6' : '#21262d'}`,
              borderRadius: 20, color: activeCollection?.id === col.id ? '#8b5cf6' : '#e6edf3',
              fontSize: 13, fontWeight: 500, cursor: loadingId === col.id ? 'wait' : 'pointer',
              whiteSpace: 'nowrap', transition: 'all 0.15s',
            }}
          >
            {loadingId === col.id ? 'Loading…' : col.name}
          </button>
        ))}
      </div>

      {/* Expanded collection movies */}
      {activeCollection && (
        <div style={{ paddingLeft: 24, paddingRight: 24 }}>
          <p style={{ fontSize: 13, color: '#8b5cf6', marginBottom: 14, fontWeight: 500 }}>
            {activeCollection.name} · {activeCollection.parts.length} films
          </p>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'thin', scrollbarColor: '#30363d transparent' }}>
            {activeCollection.parts.map(item => {
              const t       = item.title || item.name
              const yr      = (item.release_date || '').slice(0, 4)
              const existing = entries?.find(e => String(e.tmdb_id) === String(item.id) && e.media_type === 'movie')
              const isFav   = isFavorite?.(item.id, 'movie')
              return (
                <div key={item.id} style={{ flexShrink: 0, width: 130, position: 'relative' }}>
                  <div style={{ position: 'relative', marginBottom: 8, cursor: 'pointer' }}
                    onClick={() => onClickItem?.({ ...item, media_type: 'movie' })}>
                    {item.poster_path
                      ? <img src={`${TMDB_IMAGE_BASE}${item.poster_path}`} alt={t}
                          style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', borderRadius: 10, display: 'block' }} />
                      : <div style={{ width: '100%', aspectRatio: '2/3', background: '#161b22', borderRadius: 10 }} />
                    }
                    {item.vote_average > 0 && (
                      <div style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(0,0,0,0.8)', borderRadius: 4, padding: '2px 6px', fontSize: 11, fontWeight: 600, color: '#f59e0b' }}>
                        ★ {item.vote_average.toFixed(1)}
                      </div>
                    )}
                    {existing && (
                      <div style={{ position: 'absolute', top: 6, right: 30, background: STATUS_COLORS[existing.status], borderRadius: 4, padding: '2px 5px', fontSize: 9, fontWeight: 600, color: '#fff' }}>
                        {STATUS_LABELS[existing.status].split(' ')[0].toUpperCase()}
                      </div>
                    )}
                    {toggleFavorite && (
                      <div style={{ position: 'absolute', top: 6, right: 6 }}>
                        <HeartButton isFav={isFav} onToggle={() => toggleFavorite({ ...item, media_type: 'movie' })} size={24} />
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: '#e6edf3', lineHeight: 1.3, marginBottom: 2, cursor: 'pointer' }}
                    onClick={() => onClickItem?.({ ...item, media_type: 'movie' })}>
                    {t?.length > 22 ? t.slice(0, 20) + '…' : t}
                  </div>
                  <div style={{ fontSize: 11, color: '#6e7681' }}>{yr}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default function HomePage({ onNav, userId, entries, upsertEntry, removeEntry, isFavorite, toggleFavorite }) {
  const [newMovies,      setNewMovies]      = useState([])
  const [newTV,          setNewTV]          = useState([])
  const [upcomingMovies, setUpcomingMovies] = useState([])
  const [popularPicks,   setPopularPicks]   = useState([])
  const [topRated,       setTopRated]       = useState([])
  const [selected,       setSelected]       = useState(null)

  useEffect(() => {
    const today           = new Date().toISOString().slice(0, 10)
    const threeMonthsAgo  = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const threeMonthsAhead = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

    // New movies (last 90 days)
    discoverMovies({ sort_by: 'popularity.desc', 'primary_release_date.gte': threeMonthsAgo, 'primary_release_date.lte': today })
      .then(d => setNewMovies(d.results || [])).catch(() => {})

    // New TV shows
    discoverTV({ sort_by: 'popularity.desc', 'first_air_date.gte': threeMonthsAgo, 'first_air_date.lte': today })
      .then(d => setNewTV(d.results || [])).catch(() => {})

    // Upcoming movies
    discoverMovies({ sort_by: 'popularity.desc', 'primary_release_date.gte': today, 'primary_release_date.lte': threeMonthsAhead })
      .then(d => setUpcomingMovies(d.results || [])).catch(() => {})

    // Popular picks — fetch more and shuffle so it's different every reload
    discoverMovies({ sort_by: 'popularity.desc', 'vote_count.gte': 1000, 'vote_average.gte': 7 })
      .then(d => setPopularPicks(shuffle(d.results || []).slice(0, 20))).catch(() => {})

    // Top rated all time
    discoverMovies({ sort_by: 'vote_average.desc', 'vote_count.gte': 5000 })
      .then(d => setTopRated(d.results || [])).catch(() => {})

  }, []) // only runs once — popularPicks shuffled fresh each page load

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
            <button onClick={() => onNav('search')} style={{ padding: '13px 28px', background: '#c9a84c', color: '#0d1117', borderRadius: 10, fontWeight: 600, fontSize: 16 }}>
              Start Tracking
            </button>
            <button onClick={() => onNav('mylist')} style={{ padding: '13px 28px', border: '1px solid #30363d', color: '#e6edf3', borderRadius: 10, fontSize: 16 }}>
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

      {/* Scrollable rows */}
      <PosterRow title="Popular Picks" badge="Refreshes every visit" items={popularPicks} onClickItem={setSelected} entries={entries} isFavorite={isFavorite} toggleFavorite={toggleFavorite} userId={userId} upsertEntry={upsertEntry} removeEntry={removeEntry} />
      <PosterRow title="New Movie Releases" items={newMovies} onClickItem={setSelected} entries={entries} isFavorite={isFavorite} toggleFavorite={toggleFavorite} userId={userId} upsertEntry={upsertEntry} removeEntry={removeEntry} />
      <PosterRow title="New TV Shows" items={newTV} onClickItem={setSelected} entries={entries} isFavorite={isFavorite} toggleFavorite={toggleFavorite} userId={userId} upsertEntry={upsertEntry} removeEntry={removeEntry} />
      <PosterRow title="Top Rated All Time" items={topRated} onClickItem={setSelected} entries={entries} isFavorite={isFavorite} toggleFavorite={toggleFavorite} userId={userId} upsertEntry={upsertEntry} removeEntry={removeEntry} />
      <PosterRow title="Upcoming Movies" items={upcomingMovies} onClickItem={setSelected} entries={entries} isFavorite={isFavorite} toggleFavorite={toggleFavorite} userId={userId} upsertEntry={upsertEntry} removeEntry={removeEntry} />
      <CollectionRow onClickItem={setSelected} entries={entries} isFavorite={isFavorite} toggleFavorite={toggleFavorite} userId={userId} upsertEntry={upsertEntry} removeEntry={removeEntry} />

      <div style={{ height: 48 }} />

      {/* Add to list modal */}
      {selected && userId && (
        <AddToListModal
          item={selected}
          userId={userId}
          existingEntry={entries?.find(e => String(e.tmdb_id) === String(selected.id) && e.media_type === selected.media_type)}
          onClose={() => setSelected(null)}
          onSave={async payload => { await upsertEntry?.(payload); setSelected(null) }}
          onRemove={async id => { await removeEntry?.(id); setSelected(null) }}
        />
      )}
    </div>
  )
}
