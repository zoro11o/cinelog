// ─── ProfilePage ───────────────────────────────────────────

import { useState, useEffect } from 'react'
import { STATUS_LABELS, STATUS_COLORS } from '../lib/constants'
import Avatar   from '../components/ui/Avatar'
import StatCard from '../components/ui/StatCard'
import { getFollowCounts } from '../hooks/useFollow'
import AddToListModal    from '../components/modals/AddToListModal'
import FavoritesSection  from '../components/FavoritesSection'
import { supabase } from '../lib/supabase'

const POSTER_BASE = 'https://image.tmdb.org/t/p/w300'
const inputStyle  = { width: '100%', padding: '10px 14px', background: '#0d1117', border: '1px solid #21262d', borderRadius: 8, color: '#e6edf3', fontSize: 14, outline: 'none' }
const CHART_COLORS = ['#22c55e','#3b82f6','#06b6d4','#8b5cf6','#f59e0b','#ef4444','#ec4899','#84cc16','#f97316','#a78bfa']

const LANGUAGE_NAMES = {
  en:'English',hi:'Hindi',ko:'Korean',ja:'Japanese',es:'Spanish',
  fr:'French',de:'German',zh:'Chinese',ta:'Tamil',te:'Telugu',
  ml:'Malayalam',pt:'Portuguese',it:'Italian',ru:'Russian',tr:'Turkish',ar:'Arabic',
}

// Convert minutes to "X days Y hrs Z min" format
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
      <h3 style={{ fontSize: 15, fontWeight: 500, marginBottom: 16, color: '#e6edf3' }}>{title}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {data.slice(0, 8).map((item, i) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 90, fontSize: 12, color: '#8b949e', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.label}>{item.label}</div>
            <div style={{ flex: 1, height: 8, background: '#21262d', borderRadius: 4 }}>
              <div style={{ width: `${(item.count / max) * 100}%`, height: '100%', background: CHART_COLORS[i % CHART_COLORS.length], borderRadius: 4, transition: 'width 0.5s ease' }} />
            </div>
            <div style={{ width: 24, fontSize: 12, color: '#e6edf3', textAlign: 'right' }}>{item.count}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

const COUNTRY_NAMES = {
  US:'United States',GB:'United Kingdom',JP:'Japan',KR:'South Korea',FR:'France',
  DE:'Germany',IN:'India',CN:'China',IT:'Italy',ES:'Spain',AU:'Australia',
  CA:'Canada',BR:'Brazil',MX:'Mexico',RU:'Russia',SE:'Sweden',NO:'Norway',
  DK:'Denmark',FI:'Finland',NL:'Netherlands',BE:'Belgium',CH:'Switzerland',
  AT:'Austria',PL:'Poland',CZ:'Czech Republic',HU:'Hungary',RO:'Romania',
  TR:'Turkey',IR:'Iran',TH:'Thailand',HK:'Hong Kong',TW:'Taiwan',
  SG:'Singapore',MY:'Malaysia',ID:'Indonesia',PH:'Philippines',
  ZA:'South Africa',NG:'Nigeria',EG:'Egypt',AR:'Argentina',CL:'Chile',
  CO:'Colombia',PK:'Pakistan',BD:'Bangladesh',LK:'Sri Lanka',
  NZ:'New Zealand',PT:'Portugal',GR:'Greece',SR:'Suriname',
}

function DonutChart({ data, title }) {
  const [hovered, setHovered] = useState(null)
  if (!data.length) return null
  const total = data.reduce((s, d) => s + d.count, 0)
  if (!total) return null
  const size = 120, stroke = 18, radius = (size - stroke) / 2, circum = 2 * Math.PI * radius
  let offset = 0
  const slices = data.slice(0, 6).map((item, i) => {
    const pct   = item.count / total
    const dash  = pct * circum
    const s     = { ...item, pct, dash, offset, color: CHART_COLORS[i % CHART_COLORS.length] }
    offset += dash
    return s
  })
  return (
    <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 14, padding: 24 }}>
      <h3 style={{ fontSize: 15, fontWeight: 500, marginBottom: 16, color: '#e6edf3' }}>{title}</h3>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <svg width={size} height={size} style={{ flexShrink: 0, transform: 'rotate(-90deg)' }}>
          {slices.map((s, i) => (
            <circle key={i} cx={size/2} cy={size/2} r={radius} fill="none"
              stroke={hovered === i ? '#fff' : s.color}
              strokeWidth={hovered === i ? stroke + 3 : stroke}
              strokeDasharray={`${s.dash} ${circum - s.dash}`}
              strokeDashoffset={-s.offset}
              style={{ cursor: 'pointer', transition: 'stroke 0.15s, stroke-width 0.15s' }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {slices.map((s, i) => {
            const fullName = COUNTRY_NAMES[s.label] || s.label
            const isCode   = s.label.length <= 3
            return (
              <div key={i}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'default', position: 'relative' }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: hovered === i ? '#e6edf3' : '#8b949e', transition: 'color 0.15s' }}
                  title={isCode ? fullName : undefined}>
                  {isCode ? fullName : s.label}
                </span>
                <span style={{ fontSize: 12, color: '#e6edf3', marginLeft: 'auto', paddingLeft: 12 }}>{Math.round(s.pct * 100)}%</span>
              </div>
            )
          })}
        </div>
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
      <h3 style={{ fontSize: 15, fontWeight: 500, marginBottom: 20, color: '#e6edf3' }}>{title}</h3>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: fullWidth ? 12 : 6, height }}>
        {[1,2,3,4,5,6,7,8,9,10].map(score => {
          const item  = data.find(d => d.label === String(score))
          const count = item?.count || 0
          const h     = max > 0 ? (count / max) * barMax : 0
          return (
            <div key={score} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              {count > 0 && <div style={{ fontSize: fullWidth ? 13 : 10, color: '#e6edf3', fontWeight: 600 }}>{count}</div>}
              <div style={{ width: '100%', height: Math.max(h, count > 0 ? 4 : 0), background: score >= 7 ? '#10b981' : score >= 5 ? '#f59e0b' : '#ef4444', borderRadius: '3px 3px 0 0', transition: 'height 0.5s ease' }} />
              <div style={{ fontSize: fullWidth ? 14 : 10, color: '#8b949e', fontWeight: 500 }}>{score}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Interactive Release Year Line Chart ─────────────────────
function LineChart({ data, title }) {
  const [mode, setMode] = useState('count')
  if (!data.length) return null

  const sorted = [...data].sort((a, b) => a.label - b.label)
  const getValue = item => {
    if (mode === 'count') return item.count
    if (mode === 'hours') return Math.round(item.minutes / 60)
    if (mode === 'score') return item.avgScore || 0
    return item.count
  }

  const values  = sorted.map(getValue)
  const maxVal  = Math.max(...values, 1)
  const minVal  = Math.min(...values, 0)
  const range   = Math.max(maxVal - minVal, 1)

  // Fixed width per point so chart scrolls horizontally with ample space
  const PER_PT  = 52
  const H       = 180
  const PAD     = { top: 28, right: 24, bottom: 32, left: 8 }
  const W       = Math.max(PER_PT * sorted.length + PAD.left + PAD.right, 400)
  const chartH  = H - PAD.top - PAD.bottom
  const chartW  = W - PAD.left - PAD.right

  const pts = sorted.map((item, i) => ({
    x:   PAD.left + (i / Math.max(sorted.length - 1, 1)) * chartW,
    y:   PAD.top  + chartH - ((getValue(item) - minVal) / range) * chartH,
    val: getValue(item),
    item,
  }))

  // Smooth bezier curve path
  function smoothPath(points) {
    if (points.length < 2) return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1]
      const curr = points[i]
      const cpx  = (prev.x + curr.x) / 2
      d += ` C ${cpx.toFixed(1)} ${prev.y.toFixed(1)}, ${cpx.toFixed(1)} ${curr.y.toFixed(1)}, ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`
    }
    return d
  }

  const linePath = smoothPath(pts)
  const areaPath = pts.length > 0
    ? `${linePath} L ${pts[pts.length-1].x.toFixed(1)} ${(PAD.top + chartH).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(PAD.top + chartH).toFixed(1)} Z`
    : ''

  return (
    <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 14, padding: 24, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <h3 style={{ fontSize: 15, fontWeight: 500, color: '#e6edf3' }}>{title}</h3>
        <div style={{ display: 'flex', background: '#0d1117', borderRadius: 20, padding: 3, gap: 2 }}>
          {['count', 'hours', 'score'].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              padding: '4px 12px', borderRadius: 16, fontSize: 12, fontWeight: 600,
              background: mode === m ? '#10b981' : 'transparent',
              color: mode === m ? '#0d1117' : '#6e7681',
              border: 'none', cursor: 'pointer',
            }}>
              {m === 'count' ? 'Titles Watched' : m === 'hours' ? 'Hours Watched' : 'Mean Score'}
            </button>
          ))}
        </div>
      </div>
      {/* Horizontally scrollable container */}
      <div style={{ overflowX: 'auto', overflowY: 'visible', paddingBottom: 4, cursor: 'grab' }}>
        <svg width={W} height={H} style={{ display: 'block', minWidth: W }}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map(t => (
            <line key={t} x1={PAD.left} x2={W - PAD.right}
              y1={PAD.top + t * chartH} y2={PAD.top + t * chartH}
              stroke="#21262d" strokeWidth="1" />
          ))}
          {/* Area fill */}
          <path d={areaPath} fill="rgba(16,185,129,0.07)" />
          {/* Curved line */}
          <path d={linePath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
          {/* Points + labels */}
          {pts.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="4" fill="#10b981" />
              <text x={p.x} y={p.y - 10} textAnchor="middle" fill="#e6edf3" fontSize="11" fontFamily="DM Sans,sans-serif" fontWeight="500">
                {mode === 'score' ? p.val.toFixed(1) : p.val}
              </text>
              <text x={p.x} y={H - 6} textAnchor="middle" fill="#6e7681" fontSize="11" fontFamily="DM Sans,sans-serif">
                {String(p.item.label)}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  )
}

// ── Followers modal ──────────────────────────────────────────
function FollowersModal({ userId, type, onClose, onViewProfile }) {
  const [users,   setUsers]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const col = type === 'followers' ? 'follower_id' : 'following_id'
      const { data } = await supabase.from('follows').select('*').eq(type === 'followers' ? 'following_id' : 'follower_id', userId)
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
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, color: '#e6edf3' }}>
          {type === 'followers' ? 'Followers' : 'Following'}
        </h3>
        {loading && <p style={{ color: '#6e7681' }}>Loading…</p>}
        {!loading && users.length === 0 && <p style={{ color: '#6e7681' }}>None yet.</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {users.map(u => (
            <div key={u.id} onClick={() => { onViewProfile(u); onClose() }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: 8, borderRadius: 8, background: '#0d1117' }}>
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

export default function ProfilePage({ profile, entries, userId, updateProfile, onViewProfile, upsertEntry, removeEntry, favorites, toggleFavorite, isFavorite, reorderFavorites }) {
  const [editing,       setEditing]       = useState(false)
  const [username,      setUsername]      = useState(profile?.username || '')
  const [bio,           setBio]           = useState(profile?.bio || '')
  const [avatarUrl,     setAvatarUrl]     = useState(profile?.avatar_url || '')
  const [bannerUrl,     setBannerUrl]     = useState(profile?.banner_url || '')
  const [saving,        setSaving]        = useState(false)
  const [error,         setError]         = useState('')
  const [followCounts,  setFollowCounts]  = useState({ followers: 0, following: 0 })
  const [showModal,     setShowModal]     = useState(null) // 'followers' | 'following' | null
  const [selectedItem,  setSelectedItem]  = useState(null) // for opening modal from recently added

  useEffect(() => {
    getFollowCounts(userId).then(setFollowCounts)
  }, [userId])

  // ── Split movies and TV ──────────────────────────────────
  const movieEntries = entries.filter(e => e.media_type === 'movie')
  const tvEntries    = entries.filter(e => e.media_type === 'tv')

  const totalEp = tvEntries.reduce((s, e) => s + (e.episodes_watched || 0), 0)

  const scored    = entries.filter(e => e.score)
  const meanScore = scored.length ? (scored.reduce((s, e) => s + e.score, 0) / scored.length).toFixed(1) : '—'

  // Days watched — movies and TV separately
  const movieMinutes = movieEntries
    .filter(e => e.status === 'completed')
    .reduce((s, e) => s + (e.runtime || 90), 0)
  const tvMinutes = tvEntries
    .reduce((s, e) => s + (e.episodes_watched || 0) * (e.runtime || 24), 0)
  const movieDays = (movieMinutes / 1440).toFixed(1)
  const tvDays    = (tvMinutes    / 1440).toFixed(1)

  const statusCounts = Object.keys(STATUS_LABELS).map(k => ({ k, count: entries.filter(e => e.status === k).length }))
  const maxCount     = Math.max(...statusCounts.map(s => s.count), 1)
  const recent       = [...entries].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)).slice(0, 12)

  // ── Chart data ───────────────────────────────────────────
  const genreMap = {}
  entries.forEach(e => (e.genres || []).forEach(g => { genreMap[g] = (genreMap[g] || 0) + 1 }))
  const genreData = Object.entries(genreMap).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count)

  const langMap = {}
  entries.forEach(e => {
    if (e.original_language) {
      const name = LANGUAGE_NAMES[e.original_language] || e.original_language.toUpperCase()
      langMap[name] = (langMap[name] || 0) + 1
    }
  })
  const langData = Object.entries(langMap).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count)

  const countryMap = {}
  entries.forEach(e => { if (e.origin_country) countryMap[e.origin_country] = (countryMap[e.origin_country] || 0) + 1 })
  const countryData = Object.entries(countryMap).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count)

  const yearMap = {}
  entries.forEach(e => {
    if (!e.release_year) return
    const y = e.release_year
    if (!yearMap[y]) yearMap[y] = { count: 0, minutes: 0, totalScore: 0, scoreCount: 0 }
    yearMap[y].count++
    if (e.media_type === 'movie' && e.status === 'completed') yearMap[y].minutes += (e.runtime || 90)
    if (e.media_type === 'tv') yearMap[y].minutes += (e.episodes_watched || 0) * (e.runtime || 24)
    if (e.score) { yearMap[y].totalScore += e.score; yearMap[y].scoreCount++ }
  })
  const yearData = Object.entries(yearMap)
    .map(([label, d]) => ({ label, count: d.count, minutes: d.minutes, avgScore: d.scoreCount ? +(d.totalScore / d.scoreCount).toFixed(1) : 0 }))
    .sort((a, b) => a.label - b.label)

  const scoreMap = {}
  scored.forEach(e => { scoreMap[String(e.score)] = (scoreMap[String(e.score)] || 0) + 1 })
  const scoreData = Object.entries(scoreMap).map(([label, count]) => ({ label, count }))

  async function handleSave() {
    if (!username.trim()) { setError('Username cannot be empty'); return }
    setSaving(true); setError('')
    try {
      await updateProfile({ username: username.trim(), bio, avatar_url: avatarUrl, banner_url: bannerUrl })
      setEditing(false)
    } catch (err) { setError(err.message) }
    setSaving(false)
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>

      {/* ── Profile header with banner as background ── */}
      <div style={{
        border: '1px solid #21262d', borderRadius: 14, marginBottom: 24, overflow: 'hidden',
        position: 'relative',
        background: profile?.banner_url
          ? `url(${profile.banner_url}) center/cover no-repeat`
          : 'linear-gradient(135deg, #1a2332 0%, #2a1f3d 50%, #0d1117 100%)',
      }}>
        {/* Dark overlay so text is readable over any banner */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', borderRadius: 14 }} />

        {/* All content sits on top of banner */}
        <div style={{ position: 'relative', zIndex: 1, padding: '28px 28px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16, flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{ border: '3px solid rgba(255,255,255,0.15)', borderRadius: '50%', flexShrink: 0 }}>
              <Avatar url={profile?.avatar_url} name={profile?.username} size={88} />
            </div>
            <div style={{ flex: 1, minWidth: 180, paddingBottom: 4 }}>
              {!editing && (
                <>
                  <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 2, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{profile?.username || 'No username set'}</h2>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>{profile?.bio || 'No bio yet.'}</p>
                </>
              )}
            </div>
            {!editing && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, paddingBottom: 4, flexWrap: 'wrap' }}>
                {/* Follow counts — clickable */}
                <button onClick={() => setShowModal('followers')}
                  style={{ textAlign: 'center', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <div style={{ fontSize: 18, fontWeight: 600, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{followCounts.followers}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>Followers</div>
                </button>
                <button onClick={() => setShowModal('following')}
                  style={{ textAlign: 'center', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <div style={{ fontSize: 18, fontWeight: 600, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{followCounts.following}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>Following</div>
                </button>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', textShadow: '0 1px 3px rgba(0,0,0,0.8)', alignSelf: 'center' }}>
                    Member since {new Date(profile?.created_at || Date.now()).getFullYear()}
                  </span>
                  <button onClick={() => setEditing(true)} style={{ padding: '6px 14px', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 7, color: '#fff', fontSize: 13, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}>
                    Edit Profile
                  </button>
                </div>
              </div>
            )}
          </div>

          {editing && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input placeholder="Username"                                          value={username}  onChange={e => setUsername(e.target.value)}  style={inputStyle} />
              <input placeholder="Bio (optional)"                                    value={bio}       onChange={e => setBio(e.target.value)}       style={inputStyle} />
              <input placeholder="Avatar image URL — paste any image link"          value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} style={inputStyle} />
              <input placeholder="Banner image URL — paste any wide landscape image" value={bannerUrl} onChange={e => setBannerUrl(e.target.value)} style={inputStyle} />
              {error && <p style={{ color: '#f87171', fontSize: 13 }}>{error}</p>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleSave} disabled={saving} style={{ padding: '8px 18px', background: '#c9a84c', color: '#0d1117', borderRadius: 7, fontWeight: 600, fontSize: 13, opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button onClick={() => { setEditing(false); setError('') }} style={{ padding: '8px 14px', border: '1px solid #21262d', color: '#6e7681', borderRadius: 7, fontSize: 13 }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Stats — custom 2-row layout ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        {/* Row 1: Movies Watched | Movie Days | Mean Score */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <StatCard label="Movies Watched" value={movieEntries.filter(e => e.status === 'completed').length} accent="#c9a84c" />
          <StatCard label="Movie Time"     value={formatTime(movieMinutes)}  accent="#c9a84c" />
          <StatCard label="Mean Score"     value={meanScore}  accent="#8b5cf6" />
        </div>
        {/* Row 2: TV Shows | TV Days | Episodes */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <StatCard label="TV Shows"       value={tvEntries.length} accent="#3b82f6" />
          <StatCard label="TV Time"        value={formatTime(tvMinutes)}     accent="#3b82f6" />
          <StatCard label="Episodes"       value={totalEp}    accent="#3b82f6" />
        </div>
        {/* Row 3: Total Time */}
        <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 10, padding: '18px 20px' }}>
          <div style={{ fontSize: 11, color: '#6e7681', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Total Time Consumed</div>
          <div style={{ fontSize: 26, fontWeight: 600, color: '#10b981', fontFamily: "'DM Serif Display', serif" }}>
            {formatTime(movieMinutes + tvMinutes)}
          </div>
          <div style={{ fontSize: 12, color: '#6e7681', marginTop: 4 }}>
            Movies: {formatTime(movieMinutes)} · TV: {formatTime(tvMinutes)}
          </div>
        </div>
      </div>
 
          {/* ── Favorites ── */}
      {favorites && (
        <div style={{ marginBottom: 24 }}>
          <FavoritesSection
            favorites={favorites}
            toggleFavorite={toggleFavorite}
            reorderFavorites={reorderFavorites}
            userId={userId}
            currentUserId={userId}
            onItemClick={item => setSelectedItem({ ...item, tmdb_id: item.tmdb_id || item.id })}
          />
        </div>
      )}
      {/* ── Status breakdown ── */}
      <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 14, padding: 24, marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 500, marginBottom: 20 }}>Status Breakdown</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {statusCounts.map(({ k, count }) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 110, fontSize: 13, color: '#8b949e', flexShrink: 0 }}>{STATUS_LABELS[k]}</div>
              <div style={{ flex: 1, height: 6, background: '#21262d', borderRadius: 3 }}>
                <div style={{ width: `${(count / maxCount) * 100}%`, height: '100%', background: STATUS_COLORS[k], borderRadius: 3, transition: 'width 0.5s ease' }} />
              </div>
              <div style={{ width: 28, fontSize: 13, color: '#e6edf3', textAlign: 'right' }}>{count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Release Year line chart — full width ── */}
      {yearData.length > 0 && <LineChart data={yearData} title="Release Year" />}

      {/* ── Score Distribution — full width ── */}
      {scoreData.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <ScoreChart data={scoreData} title="Score Distribution" fullWidth />
        </div>
      )}

      {/* ── Distribution charts — grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
        {genreData.length  > 0 && <BarChart      data={genreData}   title="Top Genres" />}
        {langData.length   > 0 && <DonutChart    data={langData}    title="Languages" />}
        {countryData.length> 0 && <DonutChart    data={countryData} title="Countries" />}
      </div>

      

      {/* ── Recently added ── */}
      {recent.length > 0 && (
        <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 14, padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 500, marginBottom: 16 }}>Recently Added</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 10 }}>
            {recent.map(e => (
              <div key={e.id}
                onClick={() => setSelectedItem(e)}
                title={e.title}
                style={{ position: 'relative', cursor: 'pointer' }}
                onMouseEnter={ev => ev.currentTarget.style.opacity = '0.8'}
                onMouseLeave={ev => ev.currentTarget.style.opacity = '1'}
              >
                {e.poster_path
                  ? <img src={e.poster_path?.startsWith('http') ? e.poster_path : `${POSTER_BASE}${e.poster_path}`} alt={e.title}
                      style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', borderRadius: 6, display: 'block' }} />
                  : <div style={{ width: '100%', aspectRatio: '2/3', background: '#21262d', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 9, color: '#6e7681', textAlign: 'center', padding: 4 }}>{e.title}</span>
                    </div>
                }
                <div style={{ position: 'absolute', bottom: 4, left: 4, width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[e.status], border: '1.5px solid #161b22' }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Followers / Following modal ── */}
      {showModal && (
        <FollowersModal
          userId={userId}
          type={showModal}
          onClose={() => setShowModal(null)}
          onViewProfile={user => { setShowModal(null); onViewProfile(user) }}
        />
      )}

      {/* ── Edit entry modal from Recently Added ── */}
      {selectedItem && (
        <AddToListModal
          item={{ ...selectedItem, tmdb_id: selectedItem.tmdb_id, id: selectedItem.tmdb_id }}
          userId={userId}
          existingEntry={selectedItem}
          onClose={() => setSelectedItem(null)}
          onSave={async payload => {
            await upsertEntry(payload)
            setSelectedItem(null)
          }}
          onRemove={async id => {
            await removeEntry(id)
            setSelectedItem(null)
          }}
        />
      )}
    </div>
  )
}
