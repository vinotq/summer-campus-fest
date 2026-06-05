import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mark, Logo } from '../../components/Brand.jsx'
import { api } from '../../utils/api.js'

export default function StartPage() {
  const navigate = useNavigate()
  const [lastName, setLastName] = useState('')
  const [firstName, setFirstName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [checking, setChecking] = useState(true)
  const [resuming, setResuming] = useState(false)

  useEffect(() => {
    api.current()
      .then(r => {
        if (r.status === 'in_progress') setResuming(true)
        else setChecking(false) // finished или нет сессии — показываем форму
      })
      .catch(() => setChecking(false)) // 401 = нет сессии, показываем форму
  }, [])

  async function handleStart(e) {
    e.preventDefault()
    if (!lastName.trim() || !firstName.trim()) { setError('Введите фамилию и имя'); return }
    setLoading(true); setError('')
    try {
      await api.start({ lastName: lastName.trim(), firstName: firstName.trim() })
      navigate('/play', { replace: true })
    } catch (err) {
      if (err.code === 'conflict') { navigate('/play', { replace: true }); return }
      if (err.code === 'max_attempts') {
        setError('Вы уже прошли квиз 3 раза под этим именем. Результаты учтены!')
        setLoading(false)
        return
      }
      setError(err.message || 'Ошибка')
      setLoading(false)
    }
  }

  if (resuming) return (
    <div style={{ minHeight: '100dvh', background: 'var(--c-bg)', display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto' }}>
      <div className="kp-stripe" />
      <div style={{ padding: '18px 16px 8px' }}>
        <Logo size={20} />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
        <Mark size={56} style={{ marginBottom: 20 }} />
        <h2 style={{ margin: '0 0 8px', font: '700 26px/.95 var(--font-display)', letterSpacing: '-.03em', color: 'var(--c-ink)', textAlign: 'center' }}>
          Капча в процессе
        </h2>
        <p style={{ margin: '0 0 28px', font: '500 14px/1.4 var(--font-display)', color: 'var(--c-ink-500)', textAlign: 'center' }}>
          У вас есть незавершённая сессия. Продолжить капчу в этой вкладке?
        </p>
        <button className="kp-btn kp-btn--primary" style={{ width: '100%', maxWidth: 320, height: 52, font: '700 15px/1 var(--font-display)' }}
          onClick={() => navigate('/play', { replace: true })}>
          Продолжить
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>
    </div>
  )

  if (checking) return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--c-bg)' }}>
      <div style={{ font: '600 15px/1 var(--font-display)', color: 'var(--c-ink-400)' }}>Загрузка…</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--c-bg)', display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto' }}>
      <div className="kp-stripe" />
      <div style={{ padding: '18px 16px 8px' }}>
        <Logo size={20} />
      </div>

      <div style={{ padding: '24px 16px 8px' }}>
        <Mark size={64} style={{ marginBottom: 12 }} />
        <h1 style={{ margin: 0, font: '700 38px/.95 var(--font-display)', letterSpacing: '-.035em', color: 'var(--c-ink)' }}>
          Подтвердите,<br />что вы не<br />
          <span style={{ background: 'var(--grad)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>бот-студент</span>
        </h1>
      </div>

      <form onSubmit={handleStart} style={{ padding: '24px 16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <label style={{ font: '600 12px/1 var(--font-display)', color: 'var(--c-ink-700)' }}>Фамилия</label>
        <input className="kp-input" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Иванов" />
        <label style={{ font: '600 12px/1 var(--font-display)', color: 'var(--c-ink-700)', marginTop: 4 }}>Имя</label>
        <input className="kp-input" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Пётр" />
        {error && <p style={{ margin: 0, color: 'var(--c-err)', font: '500 13px/1.3 var(--font-display)' }}>{error}</p>}
        <div style={{ marginTop: 'auto' }} />
      </form>

      <div style={{ marginTop: 'auto', padding: '16px 16px 28px' }}>
        <button className="kp-btn kp-btn--primary" style={{ width: '100%', height: 56, font: '700 16px/1 var(--font-display)' }}
          onClick={handleStart} disabled={loading}>
          {loading ? 'Загрузка…' : 'Начать капчу'}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, font: '500 11px/1.2 var(--font-display)', color: 'var(--c-ink-400)' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
          До 3 попыток на одно имя
        </div>
      </div>
    </div>
  )
}
