// ─── PeoplePage ────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Avatar from '../components/ui/Avatar'
import { useFollow } from '../hooks/useFollow'

const RECENT_KEY    = 'wv_recent_people'
const MAX_RECENT    = 8

function getRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') } catch { return [] }
}

function addRecent(user) {
  const prev    = getRecent().filter(u => u.id !== user.id)
  const updated = [{ id: user.id, username: user.username, avatar_url: user.avatar_url || '', bio: user.bio || '' }, ...prev].slice(0, MAX_RECENT)
  localStorage.setItem(RECENT_KEY, JSON.stringify(updated))
}

function removeRecent(id) {
  const updated = getRecent().filter(u => u.id !== id)
  localStorage.setItem(RECENT_KEY, JSON.stringify(updated))
}

function clearRecent() {
  localStorage.removeItem(RECENT_KEY)
}

function UserCard({ user, currentUserId, onClick }) {
  const { isFollowing, loading, toggleFollow } = useFollow(currentUserId, user.id)
  return (
    <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
      <div onClick={() => onClick(user)} style={{ cursor: 'pointer', flexShrink: 0 }}>
        <Avatar url={user.avatar_url} name={user.username} size={48} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div onClick={() => onClick(user)} style={{ cursor: 'pointer' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#e6edf3', marginBottom: 2 }}>{user.username}</div>
          <div style={{ fontSize: 13, color: '#6e7681', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.bio || 'No bio'}
          </div>
        </div>
      </div>
      {currentUserId && currentUserId !== user.id && (
        <button onClick={toggleFollow} disabled={loading} style={{
          padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
          background: isFollowing ? 'transparent' : '#c9a84c',
          color:      isFollowing ? '#8b949e'     : '#0d1117',
          border:     isFollowing ? '1px solid #30363d' : 'none',
          flexShrink: 0, cursor: 'pointer', opacity: loading ? 0.6 : 1,
        }}>
          {isFollowing ? 'Unfollow' : 'Follow'}
        </button>
      )}
    </div>
  )
}

// Small recent card (avatar + name + X button)
function RecentCard({ user, onClick, onRemove }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#161b22', border: '1px solid #21262d', borderRadius: 10, padding: '10px 14px' }}>
      <div onClick={() => onClick(user)} style={{ cursor: 'pointer', flexShrink: 0 }}>
        <Avatar url={user.avatar_url} name={user.username} size={36} />
      </div>
      <div onClick={() => onClick(user)} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#e6edf3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user.username}
        </div>
        {user.bio && (
          <div style={{ fontSize: 11, color: '#6e7681', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.bio}
          </div>
        )}
      </div>
      <button onClick={e => { e.stopPropagation(); onRemove(user.id) }} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: '#6e7681', fontSize: 16, padding: '2px 4px', lineHeight: 1,
        flexShrink: 0,
      }}>
        ✕
      </button>
    </div>
  )
}

export default function PeoplePage({ currentUserId, onViewProfile }) {
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [recent,  setRecent]  = useState(getRecent)

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    setLoading(true)
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', `%${query}%`)
        .neq('id', currentUserId || '00000000-0000-0000-0000-000000000000')
        .limit(20)
      setResults(data || [])
      setLoading(false)
    }, 400)
    return () => clearTimeout(t)
  }, [query, currentUserId])

  function handleClickUser(user) {
    addRecent(user)
    setRecent(getRecent())
    onViewProfile(user)
  }

  function handleRemoveRecent(id) {
    removeRecent(id)
    setRecent(getRecent())
  }

  function handleClearRecent() {
    clearRecent()
    setRecent([])
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 24px' }}>
      <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, marginBottom: 24 }}>
        Find People
      </h2>

      {/* Search box */}
      <div style={{ position: 'relative', marginBottom: 32 }}>
        <input
          autoFocus
          placeholder="Search by username…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{ width: '100%', padding: '13px 18px', background: '#161b22', border: '1px solid #30363d', borderRadius: 10, color: '#e6edf3', fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
        />
        {loading && (
          <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#6e7681', fontSize: 13 }}>
            Searching…
          </span>
        )}
        {query && (
          <button onClick={() => setQuery('')} style={{
            position: 'absolute', right: loading ? 100 : 14, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', color: '#6e7681', fontSize: 18, cursor: 'pointer', lineHeight: 1, padding: 0,
          }}>✕</button>
        )}
      </div>

      {/* Search results */}
      {query.trim() && results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {results.map(user => (
            <UserCard key={user.id} user={user} currentUserId={currentUserId} onClick={handleClickUser} />
          ))}
        </div>
      )}

      {query.trim() && !loading && results.length === 0 && (
        <p style={{ color: '#6e7681', textAlign: 'center', padding: '60px 0' }}>No users found for "{query}"</p>
      )}

      {/* Recent searches — shown when search box is empty */}
      {!query.trim() && recent.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#6e7681', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Recent
            </span>
            <button onClick={handleClearRecent} style={{ fontSize: 12, color: '#6e7681', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              Clear all
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recent.map(user => (
              <RecentCard key={user.id} user={user} onClick={handleClickUser} onRemove={handleRemoveRecent} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!query.trim() && recent.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#6e7681' }}>
          <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.2 }}>⟡</div>
          <p>Search for a username to find people</p>
        </div>
      )}
    </div>
  )
}
