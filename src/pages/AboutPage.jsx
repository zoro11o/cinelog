// ─── AboutPage ─────────────────────────────────────────────
// To add a WatchVault logo image later, set LOGO_IMAGE to the path.
// To add your profile picture, set PROFILE_IMAGE to the path.
// Leave as null to use the default fallback.

const LOGO_IMAGE    = '/watchvault.gif' // e.g. '/logo.png' — put file in /public folder
const PROFILE_IMAGE = '/me.jpg' // e.g. '/me.jpg'   — put file in /public folder
const YOUR_NAME     = '𝙕𝙤𝙧𝙤'
const YOUR_BIO      = '· Probably watching something right now'

export default function AboutPage() {
  const links = [
    {
      id: 'watchvault',
      label: 'WatchVault',
      href: '/profile', // opens profile page — handled below via onNav
      isInternal: true,
      icon: (
         <img 
    src="https://files.catbox.moe/ay6z9p.gif" 
    alt="icon" 
    width="18" 
    height="18" 
  />
      //  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      //    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
       //   <path d="M2 17l10 5 10-5"/>
        //  <path d="M2 12l10 5 10-5"/>
       // </svg>
      ),
      color: '#c9a84c',
    },
    {
      id: 'github',
      label: 'GitHub',
      href: 'https://github.com/YOUR_USERNAME',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
        </svg>
      ),
      color: '#e6edf3',
    },
    {
      id: 'discord',
      label: 'Discord',
      href: 'https://discord.com/users/YOUR_DISCORD_ID',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.056a19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z"/>
        </svg>
      ),
      color: '#5865f2',
    },
    {
      id: 'email',
      label: 'Email',
      href: 'mailto:YOUR@EMAIL.COM',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2"/>
          <path d="m22 7-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7"/>
        </svg>
      ),
      color: '#22c55e',
    },
    {
      id: 'anilist',
      label: 'AniList',
      href: 'https://anilist.co/user/YOUR_USERNAME',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6.361 2.943L0 21.056h4.942l1.077-3.133H11.4l1.077 3.133H17.42L11.06 2.943zM7.237 14.125l1.78-5.164 1.78 5.164zM22.689 17.502h-3.666V2.944h-4.942v18.112h8.608z"/>
        </svg>
      ),
      color: '#02a9ff',
    },
  ]

  const stack = [
    { name: 'React',      desc: 'UI framework' },
    { name: 'Vite',       desc: 'Build tool' },
    { name: 'Supabase',   desc: 'Database & auth' },
    { name: 'TMDB API',   desc: 'Movie & TV data' },
  ]

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '60px 24px 80px' }}>

      {/* ── Hero ── */}
      <div style={{ marginBottom: 56 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          {/* Logo — swap LOGO_IMAGE to show a real image */}
          <div style={{ width: 52, height: 52, borderRadius: 14, overflow: 'hidden', flexShrink: 0 }}>
            {LOGO_IMAGE
              ? <img src={LOGO_IMAGE} alt="WatchVault" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : (
                <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1e3a5f, #c9a84c)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: '#fff' }}>W</span>
                </div>
              )
            }
          </div>
          <div>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, color: '#e6edf3', lineHeight: 1.1, margin: 0 }}>
              WatchVault
            </h1>
            <p style={{ fontSize: 13, color: '#6e7681', margin: '4px 0 0' }}>v0.1 — built with too much free time</p>
          </div>
        </div>
        <p style={{ fontSize: 16, color: '#8b949e', lineHeight: 1.8, margin: 0 }}>
          WatchVault is a personal movie and TV tracker inspired by AniList. Track what you've watched, rate titles, follow friends, and explore what's trending — all in one place, without ads or algorithms pushing you toward anything.
        </p>
      </div>

      <div style={{ height: 1, background: 'linear-gradient(to right, #21262d, transparent)', marginBottom: 48 }} />

      {/* ── Built by ── */}
      <div style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 11, fontWeight: 600, color: '#6e7681', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>
          Built by
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#161b22', border: '1px solid #21262d', borderRadius: 12, padding: '18px 20px' }}>
          {/* Profile image — swap PROFILE_IMAGE to show a real photo */}
          <div style={{ width: 52, height: 52, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
            {PROFILE_IMAGE
              ? <img src={PROFILE_IMAGE} alt={YOUR_NAME} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : (
                <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1e3a5f, #c9a84c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 600, color: '#fff' }}>
                  {YOUR_NAME[0]}
                </div>
              )
            }
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#e6edf3', marginBottom: 3 }}>{YOUR_NAME}</div>
            <div style={{ fontSize: 13, color: '#6e7681' }}>{YOUR_BIO}</div>
          </div>
        </div>

        {/* Contact links */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
          {links.map(link => (
            link.isInternal
              ? (
                // WatchVault profile — internal nav, not an <a> tag
                <button
                  key={link.id}
                  onClick={() => window._watchvault_goto_profile?.()}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 14px', borderRadius: 8,
                    background: '#161b22', border: '1px solid #21262d',
                    color: link.color, fontSize: 13, fontWeight: 500,
                    cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = link.color + '55'; e.currentTarget.style.background = '#21262d' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#21262d'; e.currentTarget.style.background = '#161b22' }}
                >
                  {link.icon}
                  {link.label}
                </button>
              )
              : (
                <a
                  key={link.id}
                  href={link.href}
                  target={link.id === 'email' ? '_self' : '_blank'}
                  rel="noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 14px', borderRadius: 8,
                    background: '#161b22', border: '1px solid #21262d',
                    color: link.color, fontSize: 13, fontWeight: 500,
                    textDecoration: 'none', transition: 'border-color 0.15s, background 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = link.color + '55'; e.currentTarget.style.background = '#21262d' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#21262d'; e.currentTarget.style.background = '#161b22' }}
                >
                  {link.icon}
                  {link.label}
                </a>
              )
          ))}
        </div>
      </div>

      <div style={{ height: 1, background: 'linear-gradient(to right, #21262d, transparent)', marginBottom: 48 }} />

      {/* ── Stack ── */}
      <div style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 11, fontWeight: 600, color: '#6e7681', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>
          Built with
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
          {stack.map(s => (
            <div key={s.name} style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#e6edf3', marginBottom: 3 }}>{s.name}</div>
              <div style={{ fontSize: 12, color: '#6e7681' }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: 1, background: 'linear-gradient(to right, #21262d, transparent)', marginBottom: 48 }} />

      {/* ── TMDB attribution (required by API terms) ── */}
      <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 12, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: 8, background: '#01b4e4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>
          TMDB
        </div>
        <p style={{ fontSize: 12, color: '#6e7681', lineHeight: 1.6, margin: 0 }}>
          This product uses the TMDB API but is not endorsed or certified by TMDB. All movie and TV show data, images, and metadata are provided by{' '}
          <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer" style={{ color: '#01b4e4', textDecoration: 'none' }}>
            The Movie Database
          </a>.
        </p>
      </div>

    </div>
  )
}
