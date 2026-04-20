// ─── PublicProfilePage ─────────────────────────────────────
// Identical to own profile but read-only + has a List tab

import { useState, useEffect } from 'react'
import { supabase }         from '../lib/supabase'
import LoadingSpinner       from '../components/ui/LoadingSpinner'
import ProfileContent       from '../components/ProfileContent'
import { STATUS_LABELS, STATUS_COLORS } from '../lib/constants'
import MiniCard             from '../components/ui/MiniCard'

const POSTER_BASE = 'https://image.tmdb.org/t/p/w300'

function getPoster(path) {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `${POSTER_BASE}${path}`
}

function PublicListPage({ entries, currentUserId, upsertEntry, removeEntry, currentUserEntries }) {
  const [filter,     setFilter]     = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sort,       setSort]       = useState('updated')

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
    <div style={{ padding: '24px 0' }}>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', background: '#0d1117', borderRadius: 8, border: '1px solid #21262d', overflow: 'hidden' }}>
          {['all', 'movie', 'tv'].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              style={{ padding: '7px 14px', fontSize: 13, background: typeFilter === t ? '#21262d' : 'transparent', color: typeFilter === t ? '#e6edf3' : '#6e7681', border: 'none', cursor: 'pointer' }}>
              {t === 'all' ? 'All' : t === 'movie' ? 'Movies' : 'TV Shows'}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', background: '#0d1117', borderRadius: 8, border: '1px solid #21262d', overflow: 'hidden', flexWrap: 'wrap' }}>
          {['all', ...Object.keys(STATUS_LABELS)].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              style={{ padding: '7px 12px', fontSize: 13, background: filter === s ? '#21262d' : 'transparent', color: filter === s ? (STATUS_COLORS[s] || '#e6edf3') : '#6e7681', border: 'none', cursor: 'pointer', fontWeight: filter === s ? 600 : 400 }}>
              {s === 'all' ? 'All' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)}
          style={{ padding: '7px 14px', background: '#0d1117', border: '1px solid #21262d', borderRadius: 8, color: '#e6edf3', fontSize: 13, outline: 'none', cursor: 'pointer', marginLeft: 'auto' }}>
          <option value="updated">Recently Updated</option>
          <option value="score">By Score</option>
          <option value="title">A–Z</option>
        </select>
      </div>

      {Object.keys(grouped).length === 0 && (
        <p style={{ color: '#6e7681', textAlign: 'center', padding: '60px 0' }}>Nothing here yet.</p>
      )}

      {Object.entries(grouped).map(([status, items]) => (
        <div key={status} style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 3, height: 18, borderRadius: 2, background: STATUS_COLORS[status] }} />
            <h3 style={{ fontSize: 16, fontWeight: 500, color: '#e6edf3' }}>{STATUS_LABELS[status]}</h3>
            <span style={{ fontSize: 13, color: '#6e7681' }}>({items.length})</span>
          </div>

          {/* Grid of poster cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 10 }}>
            {items.map(entry => {
              const viewerEntry = currentUserEntries?.find(
                ve => String(ve.tmdb_id) === String(entry.tmdb_id) && ve.media_type === entry.media_type
              )
              return (
                <div key={entry.id}>
                  <MiniCard
                    item={entry}
                    userId={currentUserId}
                    existingEntry={viewerEntry}
                    upsertEntry={upsertEntry}
                    removeEntry={removeEntry}
                  />
                  {/* Score badge */}
                  {entry.score && (
                    <div style={{ fontSize: 11, color: '#c9a84c', fontWeight: 600, marginTop: 3, textAlign: 'center' }}>
                      ★ {entry.score}
                    </div>
                  )}
                  {/* Episode progress for TV */}
                  {entry.media_type === 'tv' && entry.total_episodes > 0 && (
                    <div style={{ marginTop: 4 }}>
                      <div style={{ height: 2, background: '#21262d', borderRadius: 1 }}>
                        <div style={{ width: `${(entry.episodes_watched / entry.total_episodes) * 100}%`, height: '100%', background: STATUS_COLORS[status], borderRadius: 1 }} />
                      </div>
                      <div style={{ fontSize: 10, color: '#6e7681', textAlign: 'center', marginTop: 2 }}>
                        {entry.episodes_watched}/{entry.total_episodes}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function PublicProfilePage({
  targetUser, currentUserId, onBack, onViewProfile,
  currentUserEntries, upsertEntry, removeEntry,
}) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab,     setTab]     = useState('stats') // 'stats' | 'list'

  useEffect(() => {
    supabase
      .from('list_entries')
      .select('*')
      .eq('user_id', targetUser.id)
      .order('updated_at', { ascending: false })
      .then(({ data }) => { setEntries(data || []); setLoading(false) })
  }, [targetUser.id])

  if (loading) return <LoadingSpinner message="Loading profile…" />

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 24px 0' }}>

      {/* Back button */}
      <button onClick={onBack} style={{ color: '#6e7681', fontSize: 14, marginBottom: 20, background: 'none', border: 'none', cursor: 'pointer' }}>← Back</button>

      {/* Profile header — always shown */}
      <ProfileContent
        profile={targetUser}
        entries={entries}
        profileUserId={targetUser.id}
        isOwner={false}
        currentUserId={currentUserId}
        onViewProfile={onViewProfile}
        headerOnly={true}
        externalUpsertEntry={upsertEntry}
        externalRemoveEntry={removeEntry}
        externalEntries={currentUserEntries}
      />

      {/* Stats / List tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #21262d', marginBottom: 24 }}>
        {['stats', 'list'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '12px 24px', fontSize: 14, fontWeight: 500,
            color: tab === t ? '#22c55e' : '#6e7681',
            borderBottom: tab === t ? '2px solid #22c55e' : '2px solid transparent',
            background: 'transparent', border: 'none', borderBottom: tab === t ? '2px solid #22c55e' : '2px solid transparent',
            cursor: 'pointer', marginBottom: -1,
          }}>
            {t === 'stats' ? 'Stats & Charts' : `List (${entries.length})`}
          </button>
        ))}
      </div>

      {/* Stats tab — full ProfileContent without header */}
      {tab === 'stats' && (
        <ProfileContent
          profile={targetUser}
          entries={entries}
          profileUserId={targetUser.id}
          isOwner={false}
          currentUserId={currentUserId}
          onViewProfile={onViewProfile}
          statsOnly={true}
          externalUpsertEntry={upsertEntry}
          externalRemoveEntry={removeEntry}
          externalEntries={currentUserEntries}
        />
      )}

      {/* List tab */}
      {tab === 'list' && (
        <PublicListPage
          entries={entries}
          currentUserId={currentUserId}
          upsertEntry={upsertEntry}
          removeEntry={removeEntry}
          currentUserEntries={currentUserEntries}
        />
      )}
    </div>
  )
}
