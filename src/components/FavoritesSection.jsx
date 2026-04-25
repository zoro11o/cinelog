import { useState, useRef } from 'react'
import HeartButton from '../components/ui/HeartButton'

const POSTER_BASE = 'https://image.tmdb.org/t/p/w300'
function getPoster(path) {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `${POSTER_BASE}${path}`
}

function DraggableGrid({ items, isOwner, toggleFavorite, onItemClick, onReorder }) {
  const [dragIdx,   setDragIdx]   = useState(null)
  const [overIdx,   setOverIdx]   = useState(null)

  function handleDragStart(e, idx) {
    setDragIdx(idx)
    e.dataTransfer.effectAllowed = 'move'
    // Ghost image
    if (e.dataTransfer.setDragImage) {
      const el = e.currentTarget
      e.dataTransfer.setDragImage(el, el.offsetWidth / 2, el.offsetHeight / 2)
    }
  }

  function handleDragEnter(idx) {
    if (dragIdx !== null && dragIdx !== idx) setOverIdx(idx)
  }

  function handleDragEnd() {
    if (dragIdx !== null && overIdx !== null && dragIdx !== overIdx) {
      // Reorder
      const reordered = [...items]
      const [moved]   = reordered.splice(dragIdx, 1)
      reordered.splice(overIdx, 0, moved)
      const updates   = reordered.map((item, i) => ({ id: item.id, sort_order: i }))
      onReorder(updates)
    }
    setDragIdx(null)
    setOverIdx(null)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 10 }}>
      {items.map((item, idx) => (
        <div key={item.id}
          draggable={isOwner}
          onDragStart={e => handleDragStart(e, idx)}
          onDragEnter={() => handleDragEnter(idx)}
          onDragOver={e => e.preventDefault()}
          onDragEnd={handleDragEnd}
          style={{
            position: 'relative',
            cursor: isOwner ? 'grab' : 'default',
            opacity: dragIdx === idx ? 0.4 : 1,
            outline: overIdx === idx && dragIdx !== idx ? '2px solid #22c55e' : 'none',
            outlineOffset: 2,
            borderRadius: 8,
            transition: 'opacity 0.15s',
          }}
        >
          {getPoster(item.poster_path)
            ? <img src={getPoster(item.poster_path)} alt={item.title}
                onClick={() => onItemClick?.(item)}
                style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', borderRadius: 7, display: 'block', cursor: 'pointer' }} />
            : <div onClick={() => onItemClick?.(item)}
                style={{ width: '100%', aspectRatio: '2/3', background: '#21262d', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <span style={{ fontSize: 10, color: '#6e7681', padding: 4, textAlign: 'center' }}>{item.title}</span>
              </div>
          }
          {isOwner && (
            <div style={{ position: 'absolute', top: 4, right: 4 }}>
              <HeartButton isFav={true} onToggle={() => toggleFavorite(item)} size={22} />
            </div>
          )}
          <div style={{ fontSize: 11, color: '#8b949e', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.title}>
            {item.title}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function FavoritesSection({ favorites, toggleFavorite, reorderFavorites, onItemClick, userId, currentUserId }) {
  const isOwner = userId === currentUserId
  const movies  = [...(favorites || [])].filter(f => f.media_type === 'movie').sort((a, b) => a.sort_order - b.sort_order)
  const tvShows = [...(favorites || [])].filter(f => f.media_type === 'tv').sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 14, padding: 24 }}>
      <h3 style={{ fontSize: 16, fontWeight: 500, marginBottom: 4, color: '#e6edf3' }}>Favorites</h3>
      {isOwner && <p style={{ fontSize: 12, color: '#6e7681', marginBottom: 20 }}>Drag posters to reorder</p>}

      {movies.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ fontSize: 14, color: '#8b949e', marginBottom: 12, fontWeight: 500 }}>
            Movies <span style={{ color: '#6e7681', fontWeight: 400 }}>({movies.length})</span>
          </h4>
          <DraggableGrid items={movies} isOwner={isOwner} toggleFavorite={toggleFavorite} onItemClick={onItemClick} onReorder={reorderFavorites} />
        </div>
      )}

      {tvShows.length > 0 && (
        <div>
          <h4 style={{ fontSize: 14, color: '#8b949e', marginBottom: 12, fontWeight: 500 }}>
            TV Shows <span style={{ color: '#6e7681', fontWeight: 400 }}>({tvShows.length})</span>
          </h4>
          <DraggableGrid items={tvShows} isOwner={isOwner} toggleFavorite={toggleFavorite} onItemClick={onItemClick} onReorder={reorderFavorites} />
        </div>
      )}

      {movies.length === 0 && tvShows.length === 0 && (
        <p style={{ color: '#6e7681', fontSize: 13 }}>No favorites yet. Click the ♥ on any title to add it.</p>
      )}
    </div>
  )
}
