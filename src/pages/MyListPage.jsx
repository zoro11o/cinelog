import { useState } from 'react'
import { STATUS_LABELS, STATUS_COLORS } from '../lib/constants'
import HeartButton from '../components/ui/HeartButton'
import AddToListModal from '../components/modals/AddToListModal'

export default function MyListPage({ userId, entries, upsertEntry, removeEntry, favorites, toggleFavorite, isFavorite }) {
  const [filter,     setFilter]     = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sort,       setSort]       = useState('updated')
  const [selected,   setSelected]   = useState(null)

  const filtered = entries
    .filter(e => filter     === 'all' || e.status     === filter)
    .filter(e => typeFilter === 'all' || e.media_type === typeFilter)
    .sort((a, b) => {
      if (sort === 'updated') return new Date(b.updated_at) - new Date(a.updated_at)
      if (sort === 'score')   return (b.score || 0) - (a.score || 0)
      if (sort === 'title')   return a.title.localeCompare(b.title)
      return 0
    })

  const grouped = Object.keys(STATUS_LABELS).reduce((acc, k) => {
    const items = filtered.filter(e => e.status === k)
    if (items.length) acc[k] = items
    return acc
  }, {})

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>
      <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, marginBottom: 24 }}>My List</h2>

      <div style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', background: '#161b22', borderRadius: 8, border: '1px solid #21262d', overflow: 'hidden' }}>
          {['all', 'movie', 'tv'].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)} style={{ padding: '7px 14px', fontSize: 13, background: typeFilter === t ? '#21262d' : 'transparent', color: typeFilter === t ? '#e6edf3' : '#6e7681' }}>
              {t === 'all' ? 'All' : t === 'movie' ? 'Movies' : 'TV Shows'}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', background: '#161b22', borderRadius: 8, border: '1px solid #21262d', overflow: 'hidden', flexWrap: 'wrap' }}>
          {['all', ...Object.keys(STATUS_LABELS)].map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{ padding: '7px 12px', fontSize: 13, background: filter === s ? '#21262d' : 'transparent', color: filter === s ? (STATUS_COLORS[s] || '#e6edf3') : '#6e7681' }}>
              {s === 'all' ? 'All' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)} style={{ padding: '7px 14px', background: '#161b22', border: '1px solid #21262d', borderRadius: 8, color: '#e6edf3', fontSize: 13, outline: 'none', cursor: 'pointer', marginLeft: 'auto' }}>
          <option value="updated">Recently Updated</option>
          <option value="score">By Score</option>
          <option value="title">A–Z</option>
        </select>
      </div>

      {Object.keys(grouped).length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#6e7681' }}>
          <p>Nothing here yet. Search for something to add!</p>
        </div>
      )}

      {Object.entries(grouped).map(([status, items]) => (
        <div key={status} style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 3, height: 18, borderRadius: 2, background: STATUS_COLORS[status] }} />
            <h3 style={{ fontSize: 16, fontWeight: 500 }}>{STATUS_LABELS[status]}</h3>
            <span style={{ fontSize: 13, color: '#6e7681' }}>({items.length})</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {items.map(entry => {
              const progress = entry.media_type === 'tv' && entry.total_episodes > 0
                ? entry.episodes_watched / entry.total_episodes : null
              return (
                <div key={entry.id} onClick={() => setSelected(entry)}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 14px', borderRadius: 8, background: '#161b22', border: '1px solid #21262d', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#30363d'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#21262d'}>
                  {entry.poster_path
                    ? <img src={entry.poster_path?.startsWith('http') ? entry.poster_path : `https://image.tmdb.org/t/p/w300${entry.poster_path}`} alt={entry.title} style={{ width: 36, height: 54, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />
                    : <div style={{ width: 36, height: 54, background: '#21262d', borderRadius: 4, flexShrink: 0 }} />
                  }
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{entry.title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, color: '#8b949e', background: '#21262d', padding: '1px 6px', borderRadius: 3 }}>{entry.media_type === 'movie' ? 'MOVIE' : 'TV'}</span>
                      {progress !== null && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, maxWidth: 180 }}>
                          <div style={{ flex: 1, height: 3, background: '#21262d', borderRadius: 2 }}>
                            <div style={{ width: `${progress * 100}%`, height: '100%', background: STATUS_COLORS[status], borderRadius: 2 }} />
                          </div>
                          <span style={{ fontSize: 11, color: '#6e7681' }}>{entry.episodes_watched}/{entry.total_episodes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {entry.score && (
                    <div style={{ width: 34, height: 34, borderRadius: 6, background: '#c9a84c22', border: '1px solid #c9a84c55', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, color: '#c9a84c', flexShrink: 0 }}>
                      {entry.score}
                    </div>
                  )}
                  <HeartButton
                    isFav={isFavorite?.(entry.tmdb_id, entry.media_type) || false}
                    onToggle={() => toggleFavorite?.({ ...entry, id: entry.tmdb_id })}
                    size={28}
                  />
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {selected && (
        <AddToListModal
          item={{ ...selected, tmdb_id: selected.tmdb_id }}
          userId={userId} existingEntry={selected}
          onClose={() => setSelected(null)}
          onSave={async payload => { await upsertEntry(payload); setSelected(null) }}
          onRemove={async id => { await removeEntry(id); setSelected(null) }} />
      )}
    </div>
  )
}
