import { useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Logo } from '../../components/Brand.jsx'
import { api } from '../../utils/api.js'
import { getAdminSocket, disconnectAdmin } from '../../utils/socket.js'
import { useAdminStore } from '../../stores/adminStore.js'
import { useMobile } from '../../utils/useMobile.js'

const NAV = [
  { to: '/admin/players',   label: 'Игроки',   icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.87M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM16 3.13a4 4 0 0 1 0 7.75' },
  { to: '/admin/questions', label: 'Вопросы',  icon: 'M9 11h6M9 15h4M5 21l-1-3V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6l-1 1z' },
  { to: '/admin/settings',  label: 'Квиз',     icon: 'M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6z' },
  { to: '/dashboard',       label: 'Дашборд',  icon: 'M3 13l9-9 9 9M5 11v9h4v-6h6v6h4v-9' },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const isMobile = useMobile()
  const { setSessions, upsertSession, updateSessionProgress, finishSession, setSessionVisibility, setSocketStatus } = useAdminStore()

  useEffect(() => {
    api.adminMe().catch(() => navigate('/admin/login', { replace: true }))
  }, [])

  useEffect(() => {
    const socket = getAdminSocket()
    socket.connect()
    setSocketStatus('connecting')
    socket.on('connect', () => setSocketStatus('connected'))
    socket.on('disconnect', () => setSocketStatus('disconnected'))
    socket.on('players:snapshot', ({ sessions }) => setSessions(sessions))
    socket.on('players:new', ({ session }) => upsertSession(session))
    socket.on('players:update', ({ sessionId, progress, totalScore }) => updateSessionProgress(sessionId, progress, totalScore))
    socket.on('players:finished', ({ sessionId, totalScore, finishedAt }) => finishSession(sessionId, totalScore, finishedAt))
    socket.on('players:visibility', ({ sessionId, hiddenFromDashboard }) => setSessionVisibility(sessionId, hiddenFromDashboard))
    return () => { disconnectAdmin() }
  }, [])

  async function handleLogout() {
    await api.adminLogout()
    navigate('/admin/login', { replace: true })
  }

  const { socketStatus, sessions } = useAdminStore()
  const liveCount = sessions.filter(s => !s.finishedAt).length

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f6f4f0' }}>
        {/* Mobile top bar */}
        <div style={{ background: '#fff', borderBottom: '1px solid var(--c-line)', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 20 }}>
          <Logo size={16} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, font: '500 11px/1 var(--font-display)', color: socketStatus === 'connected' ? 'var(--c-ok)' : 'var(--c-err)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: socketStatus === 'connected' ? 'var(--c-ok)' : 'var(--c-err)' }} />
              {liveCount} онлайн
            </span>
            <button onClick={handleLogout} style={{ height: 28, padding: '0 10px', border: '1px solid var(--c-line)', borderRadius: 6, background: 'transparent', font: '500 11px/1 var(--font-display)', color: 'var(--c-ink-500)', cursor: 'pointer' }}>
              Выйти
            </button>
          </div>
        </div>

        {/* Content */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingBottom: 60 }}>
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid var(--c-line)', display: 'flex', zIndex: 20 }}>
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to} style={{ textDecoration: 'none', flex: 1 }}
              className={({ isActive }) => isActive ? 'kp-tab-active' : 'kp-tab'}>
              {({ isActive }) => (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '8px 4px 10px', color: isActive ? 'var(--c-purple)' : 'var(--c-ink-400)' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d={item.icon} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span style={{ font: '600 9px/1 var(--font-display)', letterSpacing: '.03em' }}>{item.label}</span>
                </div>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', minHeight: '100vh', background: '#f6f4f0' }}>
      <aside className="kp-side">
        <div style={{ padding: '0 6px 18px' }}><Logo size={18} /></div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to} style={{ textDecoration: 'none' }}
              className={({ isActive }) => `kp-nav__item ${isActive ? 'kp-nav__item--active' : ''}`}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d={item.icon} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span style={{ flex: 1 }}>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ padding: 10, background: 'var(--c-line-soft)', borderRadius: 8, font: '500 11px/1.3 var(--font-display)', color: 'var(--c-ink-500)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: socketStatus === 'connected' ? 'var(--c-ok)' : 'var(--c-err)', boxShadow: socketStatus === 'connected' ? '0 0 0 3px rgba(47,138,77,.18)' : 'none' }} />
              <b style={{ color: 'var(--c-ink-700)' }}>{socketStatus === 'connected' ? 'Сокет жив' : 'Нет связи'}</b>
            </div>
            {liveCount} онлайн
          </div>
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 8, font: '500 12px/1 var(--font-display)', color: 'var(--c-ink-700)', cursor: 'pointer', background: 'transparent', border: 0 }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--c-ink-700)', color: '#fff', font: '700 11px/1 var(--font-display)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>А</div>
            admin
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ marginLeft: 'auto' }}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      </aside>
      <main style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: '100vh' }}>
        <Outlet />
      </main>
    </div>
  )
}
