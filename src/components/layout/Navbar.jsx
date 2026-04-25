import { useState, useEffect, useRef } from 'react'

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

export default function Navbar({ user, profile, page, onNav, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

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

            {/* Profile avatar dropdown */}
            <div ref={menuRef} style={{ position: 'relative', marginLeft: 8 }}>
              <button
                onClick={() => setMenuOpen(o => !o)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 2,
                  borderRadius: '50%', display: 'flex', alignItems: 'center',
                  outline: menuOpen ? '2px solid #c9a84c' : 'none', outlineOffset: 2,
                }}
              >
                <Avatar url={profile?.avatar_url} name={profile?.username || user?.email} size={36} />
              </button>

              {/* Dropdown menu */}
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
                    { label: 'Profile',   icon: '👤', action: () => { onNav('profile'); setMenuOpen(false) } },
                    { label: 'Settings',  icon: '⚙️', action: () => { onNav('settings'); setMenuOpen(false) }, muted: true },
                    { label: 'About',     icon: 'ℹ️', action: () => { onNav('about'); setMenuOpen(false) } },
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

                  {/* Divider + Sign out */}
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
