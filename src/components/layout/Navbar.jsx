import { useState, useEffect, useRef } from 'react'
import { useNotifications } from '../../hooks/useNotifications'

function Avatar({ url, name, size = 32 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  if (url) return (
    <img src={url} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '2px solid #c9a84c' }}
      onError={e => { e.target.style.display = 'none' }} />
  )
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg, #1e3a5f, #c9a84c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 600, color: '#fff', flexShrink: 0 }}>
      {initials}
    </div>
  )
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function Navbar({ user, profile, page, onNav, onLogout }) {
  const [menuOpen, setMenuOpen]   = useState(false)
  const [bellOpen, setBellOpen]   = useState(false)
  const menuRef = useRef(null)
  const bellRef = useRef(null)

  const { notifications, unreadCount, markRead, markAllRead } = useNotifications(user?.id)

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Mark all read when opening bell
  function handleBellOpen() {
    setBellOpen(o => {
      if (!o && unreadCount > 0) markAllRead()
      return !o
    })
    setMenuOpen(false)
  }

  return (
    <nav style={{ background: '#0d1117', borderBottom: '1px solid #21262d', position: 'sticky', top: 0, zIndex: 100, padding: '0 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>

        {/* Logo */}
        <button onClick={() => onNav('home')} style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: '#c9a84c', background: 'none', border: 'none', cursor: 'pointer' }}>
          WatchVault
        </button>

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {/* Nav links */}
            {['search', 'mylist', 'people'].map(p => (
              <button key={p} onClick={() => onNav(p)} style={{
                padding: '6px 14px', borderRadius: 6, fontSize: 14, fontWeight: 500,
                color: page === p ? '#c9a84c' : '#8b949e',
                background: page === p ? 'rgba(201,168,76,0.1)' : 'transparent',
                border: 'none', cursor: 'pointer',
              }}>
                {p === 'search' ? 'Search' : p === 'mylist' ? 'My List' : 'People'}
              </button>
            ))}

            {/* ── Bell ── */}
            <div ref={bellRef} style={{ position: 'relative', marginLeft: 4 }}>
              <button
                onClick={handleBellOpen}
                style={{
                  position: 'relative', background: 'none', border: 'none', cursor: 'pointer',
                  padding: '6px 8px', borderRadius: 8, color: bellOpen ? '#e6edf3' : '#8b949e',
                  background: bellOpen ? '#21262d' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.15s, color 0.15s',
                }}
                onMouseEnter={e => { if (!bellOpen) e.currentTarget.style.background = '#161b22' }}
                onMouseLeave={e => { if (!bellOpen) e.currentTarget.style.background = 'transparent' }}
              >
                <span style={{ fontSize: 18 }}>🔔</span>
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: 2, right: 2,
                    background: '#22c55e', color: '#0d1117',
                    borderRadius: '50%', minWidth: 16, height: 16,
                    fontSize: 10, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 3px', border: '2px solid #0d1117',
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Bell dropdown */}
              {bellOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                  background: '#161b22', border: '1px solid #30363d',
                  borderRadius: 12, width: 320, maxHeight: 420, overflowY: 'auto',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)', zIndex: 200,
                }}>
                  {/* Header */}
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid #21262d', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#e6edf3' }}>Notifications</span>
                    {notifications.length > 0 && (
                      <button onClick={markAllRead} style={{ fontSize: 11, color: '#22c55e', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* List */}
                  {notifications.length === 0 ? (
                    <div style={{ padding: '40px 16px', textAlign: 'center', color: '#6e7681' }}>
                      <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.3 }}>🔔</div>
                      <p style={{ fontSize: 13 }}>No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id}
                        onClick={() => markRead(n.id)}
                        style={{
                          padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'flex-start',
                          borderBottom: '1px solid #21262d',
                          background: n.read ? 'transparent' : 'rgba(34,197,94,0.05)',
                          cursor: 'default', transition: 'background 0.1s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#21262d'}
                        onMouseLeave={e => e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(34,197,94,0.05)'}
                      >
                        {/* Icon */}
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#21262d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                          {n.type === 'follow' ? '👤' : '📢'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, color: '#e6edf3', lineHeight: 1.4, margin: 0 }}>
                            {n.message}
                          </p>
                          <p style={{ fontSize: 11, color: '#6e7681', margin: '4px 0 0' }}>
                            {timeAgo(n.created_at)}
                          </p>
                        </div>
                        {/* Unread dot */}
                        {!n.read && (
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', flexShrink: 0, marginTop: 4 }} />
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* ── Profile avatar dropdown ── */}
            <div ref={menuRef} style={{ position: 'relative', marginLeft: 4 }}>
              <button
                onClick={() => { setMenuOpen(o => !o); setBellOpen(false) }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 2,
                  borderRadius: '50%', display: 'flex', alignItems: 'center',
                  outline: menuOpen ? '2px solid #c9a84c' : 'none', outlineOffset: 2,
                }}
              >
                <Avatar url={profile?.avatar_url} name={profile?.username || user?.email} size={36} />
              </button>

              {menuOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                  background: '#161b22', border: '1px solid #30363d',
                  borderRadius: 12, width: 200, overflow: 'hidden',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                }}>
                  {/* User info */}
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid #21262d', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar url={profile?.avatar_url} name={profile?.username} size={36} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#e6edf3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {profile?.username || 'User'}
                      </div>
                      <div style={{ fontSize: 12, color: '#6e7681', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user?.email}
                      </div>
                    </div>
                  </div>

                  {/* Menu items */}
                  {[
                    { label: 'Profile',  icon: '👤', action: () => { onNav('profile'); setMenuOpen(false) } },
                    { label: 'Settings', icon: '⚙️', action: () => { onNav('settings'); setMenuOpen(false) }, muted: true },
                    { label: 'About',    icon: 'ℹ️', action: () => { onNav('about'); setMenuOpen(false) } },
                  ].map(item => (
                    <button key={item.label} onClick={item.action} style={{
                      width: '100%', padding: '11px 16px', textAlign: 'left',
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 10,
                      color: item.muted ? '#6e7681' : '#e6edf3', fontSize: 14,
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#21262d'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <span style={{ fontSize: 15 }}>{item.icon}</span>
                      {item.label}
                      {item.muted && <span style={{ fontSize: 11, color: '#30363d', marginLeft: 'auto' }}>Soon</span>}
                    </button>
                  ))}

                  <div style={{ borderTop: '1px solid #21262d' }}>
                    <button onClick={() => { onLogout(); setMenuOpen(false) }} style={{
                      width: '100%', padding: '11px 16px', textAlign: 'left',
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 10,
                      color: '#f87171', fontSize: 14, transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#21262d'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <span style={{ fontSize: 15 }}>🚪</span>
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
