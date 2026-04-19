export default function Navbar({ user, page, onNav, onLogout }) {
  return (
    <nav style={{ background: '#0d1117', borderBottom: '1px solid #21262d', position: 'sticky', top: 0, zIndex: 100, padding: '0 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
        <button onClick={() => onNav('home')} style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: '#c9a84c' }}>
          WatchVault
        </button>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {['search', 'mylist', 'people', 'profile'].map(p => (
              <button key={p} onClick={() => onNav(p)} style={{
                padding: '6px 14px', borderRadius: 6, fontSize: 14, fontWeight: 500,
                color: page === p ? '#c9a84c' : '#8b949e',
                background: page === p ? 'rgba(201,168,76,0.1)' : 'transparent',
              }}>
                {p === 'search' ? 'Search' : p === 'mylist' ? 'My List' : p === 'people' ? 'People' : 'Profile'}
              </button>
            ))}
            <button onClick={onLogout} style={{ padding: '6px 14px', borderRadius: 6, fontSize: 13, color: '#6e7681', border: '1px solid #21262d', marginLeft: 8 }}>
              Sign out
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
