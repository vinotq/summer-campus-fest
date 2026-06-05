import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo, Mark } from '../../components/Brand.jsx'
import { api } from '../../utils/api.js'
import { useMobile } from '../../utils/useMobile.js'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const isMobile = useMobile()
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await api.adminLogin({ login, password })
      navigate('/admin/players', { replace: true })
    } catch (err) {
      setError('Неверный логин или пароль')
      setLoading(false)
    }
  }

  if (isMobile) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fff', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 360 }}>
          <div style={{ marginBottom: 32 }}><Logo size={22} /></div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ font: '600 12px/1 var(--font-display)', color: 'var(--c-ink-700)' }}>Логин</label>
              <input className="kp-input" value={login} onChange={e => setLogin(e.target.value)} style={{ marginTop: 6 }} placeholder="admin" autoCapitalize="none" />
            </div>
            <div>
              <label style={{ font: '600 12px/1 var(--font-display)', color: 'var(--c-ink-700)' }}>Пароль</label>
              <input className="kp-input" type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ marginTop: 6 }} />
            </div>
            {error && <p style={{ margin: 0, color: 'var(--c-err)', font: '500 13px/1.3 var(--font-display)' }}>{error}</p>}
            <button type="submit" className="kp-btn kp-btn--primary" style={{ marginTop: 12, height: 50 }} disabled={loading}>
              {loading ? 'Входим…' : 'Войти'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#fff' }}>
      {/* Form */}
      <div style={{ padding: '64px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Logo size={22} />
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 380 }}>
          <div>
            <label style={{ font: '600 12px/1 var(--font-display)', color: 'var(--c-ink-700)' }}>Логин</label>
            <input className="kp-input" value={login} onChange={e => setLogin(e.target.value)} style={{ marginTop: 6 }} placeholder="admin" />
          </div>
          <div>
            <label style={{ font: '600 12px/1 var(--font-display)', color: 'var(--c-ink-700)' }}>Пароль</label>
            <input className="kp-input" type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ marginTop: 6 }} />
          </div>
          {error && <p style={{ margin: 0, color: 'var(--c-err)', font: '500 13px/1.3 var(--font-display)' }}>{error}</p>}
          <button type="submit" className="kp-btn kp-btn--primary" style={{ marginTop: 12, height: 50 }} disabled={loading}>
            {loading ? 'Входим…' : 'Войти'}
          </button>
        </form>
      </div>
      {/* Branded panel */}
      <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(160deg,#814387 0%,#5a2f60 55%,#E77B2E 110%)', color: '#fff' }}>
        <Mark size={520} fill="#fff" style={{ position: 'absolute', right: -120, bottom: -160, opacity: .14 }} />
        <Mark size={170} fill="#fff" style={{ position: 'absolute', left: 40, top: 60, opacity: .22 }} />
      </div>
    </div>
  )
}
