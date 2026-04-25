// ─── MiniCard ──────────────────────────────────────────────
// Poster card with a radial quick-action menu on hover.
// Trigger button (⊕) appears on hover → expands to show:
//   ✓  Mark as Completed
//   +  Add to Plan to Watch
// Clicking the poster itself opens the full AddToListModal.

import { useState } from 'react'
import { STATUS_COLORS } from '../../lib/constants'
import AddToListModal from '../modals/AddToListModal'

const POSTER_BASE = 'https://image.tmdb.org/t/p/w300'

function getPoster(path) {
  if (!path) return null
  return path.startsWith('http') ? path : `${POSTER_BASE}${path}`
}

// Radial action button
function ActionBtn({ icon, label, color, onClick, style }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick() }}
      title={label}
      style={{
        width: 32, height: 32, borderRadius: '50%',
        background: color, border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
        transition: 'transform 0.15s, opacity 0.15s',
        ...style,
      }}
      onMouseEnter={e => e.currentTarget.style.transform = (style?.transform || '') + ' scale(1.15)'}
      onMouseLeave={e => e.currentTarget.style.transform = style?.transform || 'none'}
    >
      {icon}
    </button>
  )
}

export default function MiniCard({ item, userId, existingEntry, upsertEntry, removeEntry }) {
  const [showModal,  setShowModal]  = useState(false)
  const [hover,      setHover]      = useState(false)
  const [menuOpen,   setMenuOpen]   = useState(false)
  const [saving,     setSaving]     = useState(false)

  const tmdbId    = String(item.tmdb_id || item.id || '')
  const mediaType = item.media_type || 'movie'
  const title     = item.title || item.name || ''
  const poster    = getPoster(item.poster_path)
  const status    = existingEntry?.status

  async function quickSave(newStatus) {
    if (!upsertEntry || !userId) { setShowModal(true); return }
    setSaving(true)
    setMenuOpen(false)
    try {
      await upsertEntry({
        user_id:           userId,
        tmdb_id:           tmdbId,
        media_type:        mediaType,
        title,
        poster_path:       item.poster_path || '',
        status:            newStatus,
        score:             existingEntry?.score || null,
        episodes_watched:  newStatus === 'completed'
          ? (existingEntry?.total_episodes || existingEntry?.episodes_watched || (mediaType === 'tv' ? 1 : 1))
          : (existingEntry?.episodes_watched || 0),
        total_episodes:    existingEntry?.total_episodes || (mediaType === 'tv' ? 1 : 1),
        runtime:           existingEntry?.runtime || (mediaType === 'movie' ? 90 : 24),
        genres:            existingEntry?.genres            || item.genres            || [],
        origin_country:    existingEntry?.origin_country    || '',
        original_language: existingEntry?.original_language || item.original_language || '',
        release_year:      existingEntry?.release_year      || (item.release_date || item.first_air_date || '').slice(0, 4),
        vote_average:      existingEntry?.vote_average      || item.vote_average      || 0,
        overview:          existingEntry?.overview          || item.overview          || '',
        backdrop_path:     existingEntry?.backdrop_path     || item.backdrop_path     || '',
      })
    } finally { setSaving(false) }
  }

  // Status dot color
  const statusColor = status ? STATUS_COLORS[status] : null

  return (
    <>
      <div
        style={{ position: 'relative', width: '100%' }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => { setHover(false); setMenuOpen(false) }}
      >
        {/* Poster */}
        <div onClick={() => setShowModal(true)} style={{ cursor: 'pointer', position: 'relative' }}>
          {poster
            ? <img src={poster} alt={title}
                style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', borderRadius: 7, display: 'block', transition: 'opacity 0.15s', opacity: (hover || saving) ? 0.85 : 1 }} />
            : <div style={{ width: '100%', aspectRatio: '2/3', background: '#21262d', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 9, color: '#6e7681', textAlign: 'center', padding: 4 }}>{title.slice(0, 20)}</span>
              </div>
          }
        </div>

        {/* Status dot */}
        {statusColor && (
          <div style={{ position: 'absolute', top: 6, right: 6, width: 12, height: 12, borderRadius: '50%', background: statusColor, border: '1.5px solid #0d1117', zIndex: 2 }} />
        )}

        {/* Radial menu — only when hovered and upsertEntry available */}
        {hover && upsertEntry && userId && (
          <div style={{ position: 'absolute', bottom: 8, right: 8, zIndex: 10 }}>
            {/* Expanded action buttons — slide out from trigger */}
            {menuOpen && (
              <>
                {/* ✓ Completed — top */}
                <ActionBtn
                  icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0d1117" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                  label="Mark as Completed"
                  color={status === 'completed' ? '#10b981' : '#22c55e'}
                  onClick={() => quickSave('completed')}
                  style={{ position: 'absolute', bottom: 40, right: 0, transform: 'none' }}
                />
                {/* + Plan to Watch — left */}
                <ActionBtn
                  icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0d1117" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>}
                  label="Plan to Watch"
                  color={status === 'plan_to_watch' ? '#3b82f6' : '#1d4ed8'}
                  onClick={() => quickSave('plan_to_watch')}
                  style={{ position: 'absolute', bottom: 20, right: 40, transform: 'none' }}
                />
              </>
            )}

            {/* Trigger button — always visible on hover */}
            <ActionBtn
              icon={
                saving
                  ? <div style={{ width: 10, height: 10, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                  : menuOpen
                    ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
              }
              label={menuOpen ? 'Close' : 'Quick actions'}
              color="rgba(0,0,0,0.75)"
              onClick={() => !saving && setMenuOpen(o => !o)}
              style={{ backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.2)' }}
            />
          </div>
        )}

        {/* Saving spinner overlay */}
        {saving && (
          <div style={{ position: 'absolute', inset: 0, borderRadius: 7, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#22c55e', borderRadius: '50%' }} />
          </div>
        )}
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

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </>
  )
}
