import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { login, register, clearError } from '../store/authSlice'

export default function Login() {
  const dispatch = useDispatch()
  const nav = useNavigate()
  const { loading, error } = useSelector((s) => s.auth)
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'member' })

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    dispatch(clearError())
    let result
    if (mode === 'login') {
      result = await dispatch(login({ email: form.email, password: form.password }))
    } else {
      result = await dispatch(register(form))
    }
    if (!result.error) nav('/dashboard')
  }

  const getError = () => {
    if (!error) return null
    if (typeof error === 'string') return error
    return error.non_field_errors?.[0] || error.detail || error.email?.[0] || 'Something went wrong.'
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: '100vh', background: 'var(--bg)' }}>
      {/* Left */}
      <div style={{
        background: 'var(--sidebar)', padding: '60px',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/TeamFlow.png" alt="TeamFlow logo" className="h-24 w-48 rounded-xl" />
        </div>

        <div style={{ maxWidth: 460 }}>
          <h1 style={{ margin: 0, fontSize: 44, lineHeight: 1.1, fontWeight: 600, letterSpacing: '-0.03em' }}>
            Manage projects,<br />tasks, and teams<br />
            <span style={{ color: 'var(--accent)' }}>— all in one place.</span>
          </h1>
          <p style={{ marginTop: 20, fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.55, maxWidth: 420 }}>
            A calm, focused workspace for product teams. Assign work, track progress, ship reviews.
          </p>
          
        </div>

        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-faint)' }}>
          <span>© 2026 TeamFlow</span><span>·</span><span>Privacy</span><span>·</span><span>Terms</span>
        </div>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div className="slide-up" style={{
          width: '100%', maxWidth: 380, padding: 32,
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 14, boxShadow: 'var(--shadow-md)',
        }}>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em' }}>
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>
              {mode === 'login' ? 'Sign in to continue to your workspace.' : 'Get started — it takes less than a minute.'}
            </p>
          </div>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {mode === 'register' && (
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Full name</label>
                <input style={inputStyle} value={form.name} onChange={set('name')} placeholder="Aman Kumar" required />
              </div>
            )}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Email</label>
              <input style={inputStyle} type="email" value={form.email} onChange={set('email')} placeholder="you@company.com" required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Password</label>
              <input style={inputStyle} type="password" value={form.password} onChange={set('password')} placeholder="••••••••" required />
            </div>

            {mode === 'register' && (
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Sign up as</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { id: 'member', label: 'Member', sub: 'Receive & complete tasks' },
                    { id: 'admin', label: 'Admin', sub: 'Assign & review tasks' },
                  ].map(opt => (
                    <button
                      key={opt.id} type="button"
                      onClick={() => setForm(f => ({ ...f, role: opt.id }))}
                      style={{
                        padding: '10px 12px', textAlign: 'left', borderRadius: 10,
                        background: form.role === opt.id ? 'var(--accent-soft)' : 'var(--card)',
                        border: '1px solid ' + (form.role === opt.id ? 'var(--accent)' : 'var(--border)'),
                        color: 'var(--text)', cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{opt.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{opt.sub}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {getError() && (
              <div style={{ padding: '8px 12px', background: 'var(--danger-soft)', color: 'var(--danger)', borderRadius: 8, fontSize: 12 }}>
                {getError()}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                ...btnPrimaryStyle,
                marginTop: 6, width: '100%', height: 44,
                fontSize: 14, opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Just a sec…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div style={{ marginTop: 18, fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
            {mode === 'login' ? (
              <>Don't have an account?{' '}
                <button onClick={() => setMode('register')} style={linkStyle}>Sign up</button>
              </>
            ) : (
              <>Already have an account?{' '}
                <button onClick={() => setMode('login')} style={linkStyle}>Sign in</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 10,
  border: '1px solid var(--border)', background: 'var(--card)',
  color: 'var(--text)', fontSize: 13, height: 40,
  outline: 'none', transition: 'border-color 120ms',
}

const btnPrimaryStyle = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  padding: '8px 14px', borderRadius: 10,
  background: 'var(--accent)', color: 'white', border: '1px solid var(--accent)',
  fontSize: 13, fontWeight: 500, cursor: 'pointer',
  transition: 'all 120ms',
}

const linkStyle = {
  color: 'var(--accent)', background: 'none', border: 'none',
  cursor: 'pointer', fontWeight: 500, fontSize: 13,
}
