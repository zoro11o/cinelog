import { useState } from 'react'
import HeartButton from '../components/ui/HeartButton'

const POSTER_BASE  = 'https://image.tmdb.org/t/p/w300'
const PROFILE_BASE = 'https://image.tmdb.org/t/p/w185'

function getPoster(path) {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `${POSTER_BASE}${path}`
}

function getProfileImg(path) {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `${PROFILE_BASE}${path}`
}

// ── Draggable grid for movies / TV ─────────────────────────
function DraggableGrid({ items, isOwner, toggleFavorite, onItemClick, onReorder }) {
  const [dragIdx, setDragIdx] = useState(null)
  const [overIdx, setOverIdx] = useState(null)

  function handleDragStart(e, idx) {
    setDragIdx(idx)
    e.dataTransfer.effectAllowed = 'move'
    if (e.dataTransfer.setDragImage) {
      const el = e.currentTarget
      e.dataTransfer.setDragImage(el, el.offsetWidth / 2, el.offsetHeight / 2)
    }
  }
  function handleDragEnter(idx) { if (dragIdx !== null && dragIdx !== idx) setOverIdx(idx) }
  function handleDragEnd() {
    if (dragIdx !== null && overIdx !== null && dragIdx !== overIdx) {
      const reordered = [...items]
      const [moved]   = reordered.splice(dragIdx, 1)
      reordered.splice(overIdx, 0, moved)
      onReorder(reordered.map((item, i) => ({ id: item.id, sort_order: i })))
    }
    setDragIdx(null); setOverIdx(null)
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
            position: 'relative', cursor: isOwner ? 'grab' : 'default',
            opacity: dragIdx === idx ? 0.4 : 1,
            outline: overIdx === idx && dragIdx !== idx ? '2px solid #22c55e' : 'none',
            outlineOffset: 2, borderRadius: 8, transition: 'opacity 0.15s',
          }}
        >
          {getPoster(item.poster_path)
            ? <img src={getPoster(item.poster_path)} alt={item.title} onClick={() => onItemClick?.(item)}
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

// ── Draggable grid for people ───────────────────────────────
function DraggablePeopleGrid({ items, isOwner, toggleFavorite, onReorder }) {
  const [dragIdx, setDragIdx] = useState(null)
  const [overIdx, setOverIdx] = useState(null)

  function handleDragStart(e, idx) {
    setDragIdx(idx)
    e.dataTransfer.effectAllowed = 'move'
    if (e.dataTransfer.setDragImage) {
      const el = e.currentTarget
      e.dataTransfer.setDragImage(el, el.offsetWidth / 2, el.offsetHeight / 2)
    }
  }
  function handleDragEnter(idx) { if (dragIdx !== null && dragIdx !== idx) setOverIdx(idx) }
  function handleDragEnd() {
    if (dragIdx !== null && overIdx !== null && dragIdx !== overIdx) {
      const reordered = [...items]
      const [moved]   = reordered.splice(dragIdx, 1)
      reordered.splice(overIdx, 0, moved)
      onReorder(reordered.map((item, i) => ({ id: item.id, sort_order: i })))
    }
    setDragIdx(null); setOverIdx(null)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 16 }}>
      {items.map((item, idx) => {
        const imgUrl = getProfileImg(item.poster_path)
        return (
          <div key={item.id}
            draggable={isOwner}
            onDragStart={e => handleDragStart(e, idx)}
            onDragEnter={() => handleDragEnter(idx)}
            onDragOver={e => e.preventDefault()}
            onDragEnd={handleDragEnd}
            style={{
              position: 'relative', cursor: isOwner ? 'grab' : 'default',
              opacity: dragIdx === idx ? 0.4 : 1,
              outline: overIdx === idx && dragIdx !== idx ? '2px solid #22c55e' : 'none',
              outlineOffset: 3, borderRadius: '50%', transition: 'opacity 0.15s',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            }}
          >
            {/* Circle — larger so faces aren't cut off */}
            <div
              onClick={() => window._watchvault_open_person?.(item.tmdb_id)}
              style={{
                width: 70, height: 70, borderRadius: '50%', overflow: 'hidden',
                flexShrink: 0, cursor: 'pointer',
                border: '2px solid #21262d', transition: 'border-color 0.15s',
                // Zoom out slightly so full head is visible
                background: '#21262d',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#22c55e'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#21262d'}
            >
              {imgUrl
                ? <img src={imgUrl} alt={item.title} style={{
                    width: '100%', height: '100%',
                    objectFit: 'cover',
                    // Shift image down slightly so face isn't cut at top
                    objectPosition: 'center 15%',
                    transform: 'scale(0.92)',
                    transformOrigin: 'center center',
                  }} />
                : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1e3a5f, #21262d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: '#6e7681' }}>
                    {item.title?.[0]}
                  </div>
              }
            </div>

            <div style={{ fontSize: 11, color: '#8b949e', textAlign: 'center', lineHeight: 1.3, maxWidth: 90, wordBreak: 'break-word' }} title={item.title}>
              {item.title?.length > 14 ? item.title.slice(0, 12) + '…' : item.title}
            </div>

            {isOwner && (
              <div style={{ position: 'absolute', top: 0, right: 0 }}>
                <HeartButton isFav={true} onToggle={() => toggleFavorite(item)} size={22} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Main FavoritesSection ───────────────────────────────────
export default function FavoritesSection({ favorites, toggleFavorite, reorderFavorites, onItemClick, userId, currentUserId }) {
  const isOwner = userId === currentUserId
  const movies  = [...(favorites || [])].filter(f => f.media_type === 'movie').sort((a, b) => a.sort_order - b.sort_order)
  const tvShows = [...(favorites || [])].filter(f => f.media_type === 'tv').sort((a, b) => a.sort_order - b.sort_order)
  const people  = [...(favorites || [])].filter(f => f.media_type === 'person').sort((a, b) => a.sort_order - b.sort_order)
  const hasAnything = movies.length > 0 || tvShows.length > 0 || people.length > 0

  return (
    <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 14, padding: 24 }}>
      <h3 style={{ fontSize: 16, fontWeight: 500, marginBottom: 4, color: '#e6edf3' }}>Favorites</h3>
      {isOwner && <p style={{ fontSize: 12, color: '#6e7681', marginBottom: 20 }}>Drag to reorder</p>}

      {movies.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h4 style={{ fontSize: 13, color: '#6e7681', marginBottom: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Movies <span style={{ fontWeight: 400 }}>({movies.length})</span>
          </h4>
          <DraggableGrid items={movies} isOwner={isOwner} toggleFavorite={toggleFavorite} onItemClick={onItemClick} onReorder={reorderFavorites} />
        </div>
      )}

      {tvShows.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h4 style={{ fontSize: 13, color: '#6e7681', marginBottom: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            TV Shows <span style={{ fontWeight: 400 }}>({tvShows.length})</span>
          </h4>
          <DraggableGrid items={tvShows} isOwner={isOwner} toggleFavorite={toggleFavorite} onItemClick={onItemClick} onReorder={reorderFavorites} />
        </div>
      )}

      {people.length > 0 && (
        <div>
          <h4 style={{ fontSize: 13, color: '#6e7681', marginBottom: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            People <span style={{ fontWeight: 300 }}>({people.length})</span>
          </h4>
          <DraggablePeopleGrid
            items={people}
            isOwner={isOwner}
            toggleFavorite={toggleFavorite}
            onReorder={reorderFavorites}
          />
        </div>
      )}

      {!hasAnything && (
        <p style={{ color: '#6e7681', fontSize: 13 }}>No favorites yet. Click the ♥ on any title or person to add them.</p>
      )}
    </div>
  )
}
