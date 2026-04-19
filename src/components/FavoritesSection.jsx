// ─── FavoritesSection ──────────────────────────────────────
// Draggable favorites grid split into Movies and TV Shows.

import { useState } from 'react'
import HeartButton from '../components/ui/HeartButton'

const POSTER_BASE = 'https://image.tmdb.org/t/p/w300'

function getPoster(path) {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `${POSTER_BASE}${path}`
}

export default function FavoritesSection({ favorites, toggleFavorite, reorderFavorites, onItemClick, userId, currentUserId }) {
  const [dragging,    setDragging]    = useState(null)
  const [dragOverId,  setDragOverId]  = useState(null)

  const isOwner = userId === currentUserId

  const movies = favorites.filter(f => f.media_type === 'movie').sort((a, b) => a.sort_order - b.sort_order)
  const tvShows = favorites.filter(f => f.media_type === 'tv').sort((a, b) => a.sort_order - b.sort_order)

  function handleDragStart(e, item) {
    if (!isOwner) return
    setDragging(item)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e, targetId) {
    e.preventDefault()
    if (dragging && dragging.id !== targetId) setDragOverId(targetId)
  }

  function handleDrop(e, targetItem) {
    e.preventDefault()
    if (!dragging || dragging.id === targetItem.id) { setDragging(null); setDragOverId(null); return }

    // Only allow reorder within same media_type
    if (dragging.media_type !== targetItem.media_type) { setDragging(null); setDragOverId(null); return }

    const group = favorites
      .filter(f => f.media_type === dragging.media_type)
      .sort((a, b) => a.sort_order - b.sort_order)

    const fromIdx = group.findIndex(f => f.id === dragging.id)
    const toIdx   = group.findIndex(f => f.id === targetItem.id)
    const reordered = [...group]
    reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, dragging)

    const updates = reordered.map((item, i) => ({ id: item.id, sort_order: i }))
    reorderFavorites(updates)
    setDragging(null)
    setDragOverId(null)
  }

  function FavGrid({ items, label }) {
    if (items.length === 0) return (
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 500, color: '#e6edf3', marginBottom: 12 }}>{label}</h3>
        <p style={{ fontSize: 13, color: '#6e7681' }}>No {label.toLowerCase()} favorited yet.</p>
      </div>
    )
    return (
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 500, color: '#e6edf3', marginBottom: 12 }}>
          {label} <span style={{ fontSize: 13, color: '#6e7681', fontWeight: 400 }}>({items.length})</span>
          {isOwner && <span style={{ fontSize: 11, color: '#6e7681', marginLeft: 8, fontWeight: 400 }}>drag to reorder</span>}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 10 }}>
          {items.map(item => (
            <div key={item.id}
              draggable={isOwner}
              onDragStart={e => handleDragStart(e, item)}
              onDragOver={e => handleDragOver(e, item.id)}
              onDrop={e => handleDrop(e, item)}
              onDragEnd={() => { setDragging(null); setDragOverId(null) }}
              style={{
                position: 'relative', cursor: isOwner ? 'grab' : 'default',
                opacity: dragging?.id === item.id ? 0.5 : 1,
                outline: dragOverId === item.id ? '2px solid #22c55e' : 'none',
                borderRadius: 7, transition: 'opacity 0.15s',
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
              {/* Remove heart */}
              {isOwner && (
                <div style={{ position: 'absolute', top: 4, right: 4 }}>
                  <HeartButton isFav={true} onToggle={() => toggleFavorite(item)} size={22} />
                </div>
              )}
              {/* Title tooltip on hover */}
              <div style={{ fontSize: 11, color: '#8b949e', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.title}>
                {item.title}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 14, padding: 24 }}>
      <h3 style={{ fontSize: 16, fontWeight: 500, marginBottom: 20, color: '#e6edf3' }}>Favorites</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        <FavGrid items={movies}  label="Movies" />
        <FavGrid items={tvShows} label="TV Shows" />
      </div>
    </div>
  )
}
