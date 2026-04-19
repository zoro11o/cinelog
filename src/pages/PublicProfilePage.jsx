// ─── PublicProfilePage ─────────────────────────────────────

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { STATUS_LABELS, STATUS_COLORS } from '../lib/constants'
import Avatar   from '../components/ui/Avatar'
import StatCard from '../components/ui/StatCard'
import { useFollow, getFollowCounts } from '../hooks/useFollow'
import { useFavorites } from '../hooks/useFavorites'
import FavoritesSection from '../components/FavoritesSection'

const POSTER_BASE  = 'https://image.tmdb.org/t/p/w300'
const CHART_COLORS = ['#22c55e','#3b82f6','#06b6d4','#8b5cf6','#f59e0b','#ef4444','#ec4899','#84cc16']
const LANGUAGE_NAMES = { en:'English',hi:'Hindi',ko:'Korean',ja:'Japanese',es:'Spanish',fr:'French',de:'German',zh:'Chinese',ta:'Tamil',te:'Telugu' }

function formatTime(totalMinutes) {
  if (!totalMinutes) return '0 min'
  const days = Math.floor(totalMinutes / 1440)
  const hrs  = Math.floor((totalMinutes % 1440) / 60)
  const mins = totalMinutes % 60
  const parts = []
  if (days > 0) parts.push(`${days}d`)
  if (hrs  > 0) parts.push(`${hrs}h`)
  if (mins > 0 || parts.length === 0) parts.push(`${mins}m`)
  return parts.join(' ')
}

function BarChart({ data, title }) {
  if (!data.length) return null
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 14, padding: 24 }}>
      <h3 style={{ fontSize: 15, fontWeight: 500, marginBottom: 16 }}>{title}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {data.slice(0, 6).map((item, i) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 80, fontSize: 12, color: '#8b949e', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</div>
            <div style={{ flex: 1, height: 7, background: '#21262d', borderRadius: 4 }}>
              <div style={{ width: `${(item.count / max) * 100}%`, height: '100%', background: CHART_COLORS[i % CHART_COLORS.length], borderRadius: 4 }} />
            </div>
            <div style={{ width: 24, fontSize: 12, color: '#e6edf3', textAlign: 'right' }}>{item.count}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ScoreChart({ data, title, fullWidth }) {
  if (!data.length) return null
  const max    = Math.max(...data.map(d => d.count), 1)
  const height = fullWidth ? 120 : 80
  const barMax = fullWidth ? 96  : 64
  return (
    <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 14, padding: 24 }}>
      <h3 style={{ fontSize: 15, fontWeight: 500, marginBottom: 16, color: '#e6edf3' }}>{title}</h3>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: fullWidth ? 12 : 6, height }}>
        {[1,2,3,4,5,6,7,8,9,10].map(score => {
          const item  = data.find(d => d.label === String(score))
          const count = item?.count || 0
          const h     = max > 0 ? (count / max) * barMax : 0
          return (
            <div key={score} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              {count > 0 && <div style={{ fontSize: fullWidth ? 13 : 10, color: '#e6edf3', fontWeight: 600 }}>{count}</div>}
              <div style={{ width: '100%', height: Math.max(h, count > 0 ? 4 : 0), background: score >= 7 ? '#10b981' : score >= 5 ? '#f59e0b' : '#ef4444', borderRadius: '3px 3px 0 0' }} />
              <div style={{ fontSize: fullWidth ? 14 : 10, color: '#8b949e', fontWeight: 500 }}>{score}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Followers/Following modal
function FollowListModal({ userId, type, onClose, onViewProfile }) {
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const col = type === 'followers' ? 'follower_id' : 'following_id'
      const filterCol = type === 'followers' ? 'following_id' : 'follower_id'
      const { data } = await supabase.from('follows').select('*').eq(filterCol, userId)
      if (!data?.length) { setLoading(false); return }
      const ids = data.map(f => f[col])
      const { data: profiles } = await supabase.from('profiles').select('*').in('id', ids)
      setUsers(profiles || [])
      setLoading(false)
    }
    load()
  }, [userId, type])

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 14, padding: 24, width: '100%', maxWidth: 400, maxHeight: '70vh', overflowY: 'auto' }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, color: '#e6edf3' }}>{type === 'followers' ? 'Followers' : 'Following'}</h3>
        {loading && <p style={{ color: '#6e7681' }}>Loading…</p>}
        {!loading && users.length === 0 && <p style={{ color: '#6e7681' }}>None yet.</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {users.map(u => (
            <div key={u.id} onClick={() => { onViewProfile(u); onClose() }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: 10, borderRadius: 8, background: '#0d1117' }}>
              <Avatar url={u.avatar_url} name={u.username} size={40} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#e6edf3' }}>{u.username}</div>
                <div style={{ fontSize: 12, color: '#6e7681' }}>{u.bio || 'No bio'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function PublicProfilePage({ targetUser, currentUserId, onBack, onViewProfile }) {
  const [entries,      setEntries]      = useState([])
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 })
  const [loading,      setLoading]      = useState(true)
  const [listFilter,   setListFilter]   = useState('completed')
  const [showModal,    setShowModal]    = useState(null)

  const { isFollowing, toggleFollow } = useFollow(currentUserId, targetUser.id)
  const { favorites: targetFavorites } = useFavorites(targetUser.id)

  useEffect(() => {
    async function load() {
      const [{ data: ents }, counts] = await Promise.all([
        supabase.from('list_entries').select('*').eq('user_id', targetUser.id).order('updated_at', { ascending: false }),
        getFollowCounts(targetUser.id),
      ])
      setEntries(ents || [])
      setFollowCounts(counts)
      setLoading(false)
    }
    load()
  }, [targetUser.id])

  if (loading) return <div style={{ textAlign: 'center', padding: '80px 0', color: '#6e7681' }}>Loading…</div>

  const movieEntries = entries.filter(e => e.media_type === 'movie')
  const tvEntries    = entries.filter(e => e.media_type === 'tv')
  const totalEp      = tvEntries.reduce((s, e) => s + (e.episodes_watched || 0), 0)
  const scored       = entries.filter(e => e.score)
  const meanScore    = scored.length ? (scored.reduce((s, e) => s + e.score, 0) / scored.length).toFixed(1) : '—'
  const movieMinutes = movieEntries.filter(e => e.status === 'completed').reduce((s, e) => s + (e.runtime || 90), 0)
  const tvMinutes    = tvEntries.reduce((s, e) => s + (e.episodes_watched || 0) * (e.runtime || 24), 0)
  const movieDays    = (movieMinutes / 1440).toFixed(1)
  const tvDays       = (tvMinutes    / 1440).toFixed(1)
  const statusCounts = Object.keys(STATUS_LABELS).map(k => ({ k, count: entries.filter(e => e.status === k).length }))
  const maxCount     = Math.max(...statusCounts.map(s => s.count), 1)

  const genreMap = {}
  entries.forEach(e => (e.genres || []).forEach(g => { genreMap[g] = (genreMap[g] || 0) + 1 }))
  const genreData = Object.entries(genreMap).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count)

  const scoreMap = {}
  scored.forEach(e => { scoreMap[String(e.score)] = (scoreMap[String(e.score)] || 0) + 1 })
  const scoreData = Object.entries(scoreMap).map(([label, count]) => ({ label, count }))

  const listEntries = entries.filter(e => e.status === listFilter)

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>
      <button onClick={onBack} style={{ color: '#6e7681', fontSize: 14, marginBottom: 20 }}>← Back</button>

      {/* Profile header */}
      <div style={{ border: '1px solid #21262d', borderRadius: 14, marginBottom: 24, overflow: 'hidden' }}>
        <div style={{
          height: 160,
          background: targetUser.banner_url
            ? `url(${targetUser.banner_url}) center/cover no-repeat`
            : 'linear-gradient(135deg, #1a2332 0%, #0d1117 100%)',
          position: 'relative',
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} />
        </div>
        <div style={{ background: '#161b22', padding: '0 28px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, marginTop: -44, marginBottom: 16, flexWrap: 'wrap' }}>
            <div style={{ border: '4px solid #161b22', borderRadius: '50%', flexShrink: 0 }}>
              <Avatar url={targetUser.avatar_url} name={targetUser.username} size={88} />
            </div>
            <div style={{ flex: 1, minWidth: 180, paddingBottom: 4 }}>
              <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 2, color: '#e6edf3' }}>{targetUser.username}</h2>
              <p style={{ fontSize: 14, color: '#6e7681' }}>{targetUser.bio || 'No bio.'}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, paddingBottom: 4, flexWrap: 'wrap' }}>
              <button onClick={() => setShowModal('followers')} style={{ textAlign: 'center', background: 'none', border: 'none', cursor: 'pointer' }}>
                <div style={{ fontSize: 18, fontWeight: 600, color: '#e6edf3' }}>{followCounts.followers}</div>
                <div style={{ fontSize: 12, color: '#6e7681' }}>Followers</div>
              </button>
              <button onClick={() => setShowModal('following')} style={{ textAlign: 'center', background: 'none', border: 'none', cursor: 'pointer' }}>
                <div style={{ fontSize: 18, fontWeight: 600, color: '#e6edf3' }}>{followCounts.following}</div>
                <div style={{ fontSize: 12, color: '#6e7681' }}>Following</div>
              </button>
              {currentUserId !== targetUser.id && (
                <button onClick={toggleFollow} style={{
                  padding: '8px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600,
                  background: isFollowing ? 'transparent' : '#c9a84c',
                  color:      isFollowing ? '#8b949e'     : '#0d1117',
                  border:     isFollowing ? '1px solid #30363d' : 'none', cursor: 'pointer',
                }}>
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
        <StatCard label="Movies Watched" value={movieEntries.filter(e => e.status === 'completed').length} accent="#c9a84c" />
        <StatCard label="Movie Time"     value={formatTime(movieMinutes)}  accent="#c9a84c" />
        <StatCard label="TV Shows"       value={tvEntries.length}          accent="#3b82f6" />
        <StatCard label="Episodes"       value={totalEp}                   accent="#3b82f6" />
        <StatCard label="TV Time"        value={formatTime(tvMinutes)}     accent="#3b82f6" />
        <StatCard label="Mean Score"     value={meanScore}                 accent="#8b5cf6" />
      </div>

      {/* ── Status Breakdown — separate card ── */}
      <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 14, padding: 24, marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 500, marginBottom: 20, color: '#e6edf3' }}>Status Breakdown</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {statusCounts.map(({ k, count }) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 110, fontSize: 13, color: '#8b949e', flexShrink: 0 }}>{STATUS_LABELS[k]}</div>
              <div style={{ flex: 1, height: 6, background: '#21262d', borderRadius: 3 }}>
                <div style={{ width: `${(count / maxCount) * 100}%`, height: '100%', background: STATUS_COLORS[k], borderRadius: 3 }} />
              </div>
              <div style={{ width: 28, fontSize: 13, color: '#e6edf3', textAlign: 'right' }}>{count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Score Distribution — full width separate card ── */}
      {scoreData.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <ScoreChart data={scoreData} title="Score Distribution" fullWidth />
        </div>
      )}

      {/* ── Genre + other charts ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
        {genreData.length > 0 && <BarChart data={genreData} title="Top Genres" />}
      </div>

      {/* Favorites — read only view of target user's favorites */}
      {targetFavorites && targetFavorites.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <FavoritesSection
            favorites={targetFavorites}
            toggleFavorite={() => {}}
            reorderFavorites={() => {}}
            userId={targetUser.id}
            currentUserId={currentUserId}
          />
        </div>
      )}

      {/* Watchlist */}
      <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 14, padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 500, marginBottom: 16 }}>Watchlist</h3>
        <div style={{ display: 'flex', gap: 0, background: '#0d1117', borderRadius: 8, padding: 3, marginBottom: 20, flexWrap: 'wrap' }}>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <button key={k} onClick={() => setListFilter(k)} style={{
              padding: '7px 12px', fontSize: 12, borderRadius: 6,
              background: listFilter === k ? '#21262d' : 'transparent',
              color: listFilter === k ? STATUS_COLORS[k] : '#6e7681',
              fontWeight: listFilter === k ? 600 : 400,
            }}>{v} ({entries.filter(e => e.status === k).length})</button>
          ))}
        </div>
        {listEntries.length === 0 && <p style={{ color: '#6e7681', fontSize: 14 }}>Nothing here.</p>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 10 }}>
          {listEntries.map(e => (
            <div key={e.id} title={e.title} style={{ position: 'relative' }}>
              {e.poster_path
                ? <img src={e.poster_path?.startsWith('http') ? e.poster_path : `${POSTER_BASE}${e.poster_path}`} alt={e.title}
                    style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', borderRadius: 7, display: 'block' }} />
                : <div style={{ width: '100%', aspectRatio: '2/3', background: '#21262d', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 10, color: '#6e7681', padding: 4, textAlign: 'center' }}>{e.title}</span>
                  </div>
              }
              {e.score && (
                <div style={{ position: 'absolute', bottom: 4, right: 4, background: 'rgba(0,0,0,0.8)', borderRadius: 3, padding: '1px 5px', fontSize: 10, fontWeight: 600, color: '#c9a84c' }}>
                  {e.score}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <FollowListModal
          userId={targetUser.id}
          type={showModal}
          onClose={() => setShowModal(null)}
          onViewProfile={user => { setShowModal(null); onViewProfile && onViewProfile(user) }}
        />
      )}
    </div>
  )
}
