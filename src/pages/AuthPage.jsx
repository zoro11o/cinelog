// ─── AuthPage ──────────────────────────────────────────────
// Works both as a full page and as a modal overlay.
// Pass onClose prop to use as modal.

import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

const inputStyle = {
  width: '100%', padding: '10px 14px', background: '#0d1117',
  border: '1px solid #21262d', borderRadius: 8, color: '#e6edf3',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
}

const OAUTH_PROVIDERS = [
  {
    id: 'discord',
    label: 'Continue with Discord',
    color: '#5865f2',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
      </svg>
    ),
  },
  {
    id: 'google',
    label: 'Continue with Google',
    color: '#fff',
    textColor: '#0d1117',
    border: '1px solid #30363d',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    ),
  },
]

export default function AuthPage({ onClose }) {
  const { signIn, signUp, signInWithOAuth } = useAuth()
  const [mode,     setMode]     = useState('login')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [oauthLoading, setOauthLoading] = useState(null)

  const isModal = !!onClose

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setSuccess(''); setLoading(true)
    try {
      if (mode === 'login') {
        await signIn(email, password)
        onClose?.()
      } else {
        if (!username.trim()) throw new Error('Username is required')
        if (username.trim().length < 3) throw new Error('Username must be at least 3 characters')
        const data = await signUp(email, password, username)
        if (!data.user) setSuccess('Check your email to confirm your account!')
        else onClose?.()
      }
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  async function handleOAuth(provider) {
    setOauthLoading(provider)
    setError('')
    try {
      await signInWithOAuth(provider)
      // Page will redirect — no need to do anything
    } catch (err) {
      setError(err.message)
      setOauthLoading(null)
    }
  }

  const card = (
    <div style={{ width: '100%', maxWidth: 400 }}>
      {/* Logo — only shown on full page */}
      {!isModal && (
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 40, color: '#c9a84c', marginBottom: 8 }}>
            WatchVault
          </h1>
          <p style={{ color: '#6e7681', fontSize: 15 }}>Track everything you watch</p>
        </div>
      )}

      <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 14, padding: 28, position: 'relative' }}>
        {/* Modal close button */}
        {isModal && (
          <button onClick={onClose} style={{
            position: 'absolute', top: 14, right: 14,
            background: 'none', border: 'none', color: '#6e7681',
            fontSize: 20, cursor: 'pointer', lineHeight: 1, padding: 2,
          }}>✕</button>
        )}

        {isModal && (
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: '#e6edf3', marginBottom: 4 }}>
              Join WatchVault
            </h2>
            <p style={{ fontSize: 13, color: '#6e7681' }}>Sign in to track, rate and save titles to your list</p>
          </div>
        )}

        {/* OAuth buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {OAUTH_PROVIDERS.map(p => (
            <button key={p.id} onClick={() => handleOAuth(p.id)} disabled={!!oauthLoading}
              style={{
                width: '100%', padding: '10px 16px', borderRadius: 8,
                background: p.color, color: p.textColor || '#fff',
                border: p.border || 'none',
                fontSize: 14, fontWeight: 600, cursor: oauthLoading ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                opacity: oauthLoading && oauthLoading !== p.id ? 0.5 : 1,
                transition: 'opacity 0.15s, filter 0.15s',
              }}
              onMouseEnter={e => { if (!oauthLoading) e.currentTarget.style.filter = 'brightness(0.9)' }}
              onMouseLeave={e => e.currentTarget.style.filter = 'none'}
            >
              {p.icon}
              {oauthLoading === p.id ? 'Redirecting…' : p.label}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: '#21262d' }} />
          <span style={{ fontSize: 12, color: '#6e7681' }}>or</span>
          <div style={{ flex: 1, height: 1, background: '#21262d' }} />
        </div>

        {/* Login / Signup tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 18, background: '#0d1117', borderRadius: 8, padding: 3 }}>
          {['login', 'signup'].map(m => (
            <button key={m} onClick={() => { setMode(m); setError('') }} style={{
              flex: 1, padding: 8, borderRadius: 6, fontSize: 14, fontWeight: 500,
              background: mode === m ? '#21262d' : 'transparent',
              color: mode === m ? '#e6edf3' : '#6e7681',
              border: 'none', cursor: 'pointer',
            }}>
              {m === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mode === 'signup' && (
            <input placeholder="Username (min 3 chars)" value={username}
              onChange={e => setUsername(e.target.value)} style={inputStyle} />
          )}
          <input type="email" placeholder="Email" value={email}
            onChange={e => setEmail(e.target.value)} style={inputStyle} />
          <input type="password" placeholder="Password" value={password}
            onChange={e => setPassword(e.target.value)} style={inputStyle} />

          {error   && <p style={{ color: '#f87171', fontSize: 13, margin: 0 }}>{error}</p>}
          {success && <p style={{ color: '#34d399', fontSize: 13, margin: 0 }}>{success}</p>}

          <button type="submit" disabled={loading} style={{
            padding: 12, borderRadius: 8, background: '#c9a84c',
            color: '#0d1117', fontWeight: 600, fontSize: 15,
            opacity: loading ? 0.7 : 1, marginTop: 4, cursor: loading ? 'default' : 'pointer',
            border: 'none',
          }}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  )

  // Full page mode
  if (!isModal) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'radial-gradient(ellipse at 50% 0%, #1a2332 0%, #0d1117 60%)' }}>
        {card}
      </div>
    )
  }

  // Modal overlay mode
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 24 }}>
      <div onClick={e => e.stopPropagation()}>
        {card}
      </div>
    </div>
  )
}
