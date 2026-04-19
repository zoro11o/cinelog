// ─── PeoplePage ────────────────────────────────────────────
// Search for other users and view their profiles.

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Avatar from '../components/ui/Avatar'
import { useFollow, getFollowCounts } from '../hooks/useFollow'

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
      {currentUserId !== user.id && (
        <button
          onClick={toggleFollow}
          disabled={loading}
          style={{
            padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: isFollowing ? 'transparent' : '#c9a84c',
            color:      isFollowing ? '#8b949e'     : '#0d1117',
            border:     isFollowing ? '1px solid #30363d' : 'none',
            flexShrink: 0, cursor: 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {isFollowing ? 'Unfollow' : 'Follow'}
        </button>
      )}
    </div>
  )
}

export default function PeoplePage({ currentUserId, onViewProfile }) {
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    setLoading(true)
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', `%${query}%`)
        .neq('id', currentUserId)
        .limit(20)
      setResults(data || [])
      setLoading(false)
    }, 400)
    return () => clearTimeout(t)
  }, [query, currentUserId])

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 24px' }}>
      <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, marginBottom: 24 }}>
        Find People
      </h2>

      <div style={{ position: 'relative', marginBottom: 32 }}>
        <input
          autoFocus
          placeholder="Search by username…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{ width: '100%', padding: '13px 18px', background: '#161b22', border: '1px solid #30363d', borderRadius: 10, color: '#e6edf3', fontSize: 15, outline: 'none' }}
        />
        {loading && <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#6e7681', fontSize: 13 }}>Searching…</span>}
      </div>

      {results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {results.map(user => (
            <UserCard key={user.id} user={user} currentUserId={currentUserId} onClick={onViewProfile} />
          ))}
        </div>
      )}

      {query && !loading && results.length === 0 && (
        <p style={{ color: '#6e7681', textAlign: 'center', padding: '60px 0' }}>No users found for "{query}"</p>
      )}

      {!query && (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#6e7681' }}>
          <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.2 }}>⟡</div>
          <p>Search for a username to find people</p>
        </div>
      )}
    </div>
  )
}
