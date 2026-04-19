// ─── AuthPage ──────────────────────────────────────────────
// Sign in / Sign up page. Shown when no user is logged in.

import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

const inputStyle = { width: '100%', padding: '10px 14px', background: '#0d1117', border: '1px solid #21262d', borderRadius: 8, color: '#e6edf3', fontSize: 14, outline: 'none' }

export default function AuthPage() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setSuccess(''); setLoading(true)
    try {
      if (mode === 'login') {
        await signIn(email, password)
      } else {
        if (!username.trim()) throw new Error('Username is required')
        const data = await signUp(email, password, username)
        if (!data.user) setSuccess('Check your email to confirm your account!')
      }
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'radial-gradient(ellipse at 50% 0%, #1a2332 0%, #0d1117 60%)' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 40, color: '#c9a84c', marginBottom: 8 }}>WatchVault</h1>
          <p style={{ color: '#6e7681', fontSize: 15 }}>Track everything you watch</p>
        </div>
        <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 14, padding: 32 }}>
          <div style={{ display: 'flex', gap: 0, marginBottom: 24, background: '#0d1117', borderRadius: 8, padding: 3 }}>
            {['login', 'signup'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError('') }} style={{ flex: 1, padding: 8, borderRadius: 6, fontSize: 14, fontWeight: 500, background: mode === m ? '#21262d' : 'transparent', color: mode === m ? '#e6edf3' : '#6e7681' }}>
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {mode === 'signup' && <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} style={inputStyle} />}
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} />
            {error && <p style={{ color: '#f87171', fontSize: 13 }}>{error}</p>}
            {success && <p style={{ color: '#34d399', fontSize: 13 }}>{success}</p>}
            <button type="submit" disabled={loading} style={{ padding: 12, borderRadius: 8, background: '#c9a84c', color: '#0d1117', fontWeight: 600, fontSize: 15, opacity: loading ? 0.7 : 1, marginTop: 4 }}>
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
