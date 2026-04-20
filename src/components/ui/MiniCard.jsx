// ─── MiniCard ──────────────────────────────────────────────
// Small poster card used everywhere (Recently Added, Related, Seasons, etc)
// - Click poster → opens full AddToListModal
// - ▶ button (bottom right) → quick-marks as Completed without opening modal
// - Works on own profile, other people's profiles, search results

import { useState } from 'react'
import { STATUS_COLORS } from '../../lib/constants'
import AddToListModal from '../modals/AddToListModal'

const POSTER_BASE = 'https://image.tmdb.org/t/p/w300'

function getPoster(path) {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `${POSTER_BASE}${path}`
}

export default function MiniCard({ item, userId, existingEntry, upsertEntry, removeEntry, size = 80 }) {
  const [showModal,   setShowModal]   = useState(false)
  const [completing,  setCompleting]  = useState(false)

  // Normalize — item might come from DB (has tmdb_id) or from TMDB API (has id)
  const tmdbId    = String(item.tmdb_id || item.id || '')
  const mediaType = item.media_type || 'movie'
  const title     = item.title || item.name || ''
  const poster    = getPoster(item.poster_path || '')
  const status    = existingEntry?.status

  async function handleQuickComplete(e) {
    e.stopPropagation()
    if (!upsertEntry || !userId) return
    setCompleting(true)
    try {
      await upsertEntry({
        user_id:           userId,
        tmdb_id:           tmdbId,
        media_type:        mediaType,
        title,
        poster_path:       item.poster_path || '',
        status:            'completed',
        score:             existingEntry?.score || null,
        episodes_watched:  existingEntry?.total_episodes || existingEntry?.episodes_watched || 1,
        total_episodes:    existingEntry?.total_episodes || 1,
        runtime:           existingEntry?.runtime || (mediaType === 'movie' ? 90 : 24),
        genres:            existingEntry?.genres || item.genres || [],
        origin_country:    existingEntry?.origin_country || '',
        original_language: existingEntry?.original_language || item.original_language || '',
        release_year:      existingEntry?.release_year || (item.release_date || item.first_air_date || '').slice(0, 4),
      })
    } finally { setCompleting(false) }
  }

  return (
    <>
      <div
        title={title}
        style={{ position: 'relative', width: '100%' }}
        onMouseEnter={e => e.currentTarget.querySelector('.mini-overlay').style.opacity = '1'}
        onMouseLeave={e => e.currentTarget.querySelector('.mini-overlay').style.opacity = '0'}
      >
        {/* Poster */}
        <div onClick={() => setShowModal(true)} style={{ cursor: 'pointer' }}>
          {poster
            ? <img src={poster} alt={title} style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', borderRadius: 7, display: 'block' }} />
            : <div style={{ width: '100%', aspectRatio: '2/3', background: '#21262d', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 9, color: '#6e7681', textAlign: 'center', padding: 4 }}>{title.slice(0, 20)}</span>
              </div>
          }
        </div>

        {/* Status dot */}
        {status && (
          <div style={{ position: 'absolute', bottom: 4, left: 4, width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[status], border: '1.5px solid #161b22' }} />
        )}

        {/* Hover overlay — quick complete button */}
        <div className="mini-overlay" style={{ position: 'absolute', inset: 0, borderRadius: 7, background: 'rgba(0,0,0,0.5)', opacity: 0, transition: 'opacity 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {upsertEntry && userId && status !== 'completed' && (
            <button
              onClick={handleQuickComplete}
              disabled={completing}
              title="Mark as Completed"
              style={{
                width: 36, height: 36, borderRadius: '50%',
                background: completing ? '#6e7681' : '#22c55e',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s',
              }}
            >
              {/* Play/check icon */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0d1117" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
          )}
          {status === 'completed' && (
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0d1117" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Full modal */}
      {showModal && (
        <AddToListModal
          item={{ ...item, tmdb_id: tmdbId, id: tmdbId, media_type: mediaType }}
          userId={userId}
          existingEntry={existingEntry}
          onClose={() => setShowModal(false)}
          onSave={async payload => { await upsertEntry?.(payload); setShowModal(false) }}
          onRemove={async id => { await removeEntry?.(id); setShowModal(false) }}
        />
      )}
    </>
  )
}
