import { useEffect, useState } from 'react'
import { Logo, Mark, MarkField } from '../components/Brand.jsx'
import { api } from '../utils/api.js'
import { getDashboardSocket, disconnectDashboard } from '../utils/socket.js'

export default function DashboardPage() {
  const [top, setTop] = useState([])
  const [liveCount, setLiveCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    api.dashboardTop().then(r => setTop(r.top))
    const socket = getDashboardSocket()
    socket.connect()
    socket.on('top:update', ({ top }) => setTop(top))
    return () => { disconnectDashboard() }
  }, [])

  const maxScore = top[0]?.totalScore || 1

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', background: 'linear-gradient(160deg,#1a1014 0%,#2a1a2e 50%,#1a0f12 100%)', color: '#fff', overflow: 'hidden', fontFamily: 'var(--font-display)' }}>
      <MarkField count={20} opacity={.05} color="#fff" />
      <Mark size={700} fill="#fff" style={{ position: 'absolute', right: -180, top: -200, opacity: .12, pointerEvents: 'none' }} />

      {/* Header */}
      <div style={{ position: 'absolute', left: 64, right: 64, top: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Logo size={48} dark />
        <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
          <Stat label="Играют сейчас" value={String(liveCount || top.length)} live />
          <Stat label="Завершили" value={String(totalCount || top.length)} />
        </div>
      </div>

      {/* Title */}
      <div style={{ position: 'absolute', left: 64, top: 156 }}>
        <h1 style={{ margin: 0, font: '800 100px/.86 var(--font-display)', letterSpacing: '-.045em', background: 'linear-gradient(135deg,#fff 0%,#fff 60%,#E77B2E 110%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
          Не бот.<br/>Свой.
        </h1>
      </div>

      {/* Leaderboard */}
      <div style={{ position: 'absolute', right: 64, top: 140, width: 820, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {top.map((row) => <LeaderRow key={row.sessionId} row={row} maxScore={maxScore} />)}
        {top.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,.4)', font: '600 18px/1 var(--font-display)' }}>
            Результатов пока нет — будь первым!
          </div>
        )}
      </div>

      {/* QR block */}
      <div style={{ position: 'absolute', left: 64, bottom: 48 }}>
        <div style={{ padding: 3, borderRadius: 24, background: 'linear-gradient(135deg, #E77B2E 0%, #814387 100%)' }}>
          <div style={{ borderRadius: 22, background: 'linear-gradient(160deg,#1e1024 0%,#2a1a2e 100%)', padding: '28px 28px 22px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <div style={{ padding: 14, background: '#fff', borderRadius: 20 }}>
              <img src="/qr-code.svg" width={360} height={360} style={{ display: 'block' }} alt="QR" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ font: '800 26px/1 var(--font-display)', letterSpacing: '-.02em', color: '#fff', marginBottom: 7 }}>
                Сканируй и участвуй
              </div>
              <div style={{ font: '500 18px/1 var(--font-display)', color: 'rgba(255,255,255,.45)' }}>
                sirius-campus.ru
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, live }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, font: '600 12px/1 var(--font-display)', letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.55)', marginBottom: 4 }}>
        {live && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff5a5a', boxShadow: '0 0 8px #ff5a5a' }} />}
        {label}
      </div>
      <div className="kp-num" style={{ font: '800 32px/1 var(--font-display)', letterSpacing: '-.03em', color: '#fff' }}>{value}</div>
    </div>
  )
}

function LeaderRow({ row, maxScore }) {
  const isTop3 = row.rank <= 3
  const fillPct = (row.totalScore / maxScore) * 100
  return (
    <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '72px 1fr auto 72px', alignItems: 'center', gap: 20, padding: '16px 24px', borderRadius: 12, background: row.isNew ? 'linear-gradient(90deg,rgba(231,123,46,.18),rgba(129,67,135,.18))' : 'rgba(255,255,255,.04)', border: row.isNew ? '1px solid rgba(231,123,46,.5)' : '1px solid rgba(255,255,255,.06)', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${fillPct}%`, background: isTop3 ? 'linear-gradient(90deg,rgba(231,123,46,.22),rgba(129,67,135,.15))' : 'rgba(255,255,255,.03)', zIndex: 0 }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <span className="kp-num" style={{ font: `${isTop3?'800':'700'} ${isTop3?52:40}px/.85 var(--font-display)`, letterSpacing: '-.05em', color: isTop3 ? '#fff' : 'rgba(255,255,255,.5)' }}>{row.rank}</span>
      </div>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <span style={{ font: `${isTop3?'700':'600'} ${isTop3?32:26}px/1 var(--font-display)`, letterSpacing: '-.022em', color: isTop3 ? '#fff' : 'rgba(255,255,255,.85)' }}>{row.name}</span>
      </div>
      <div style={{ position: 'relative', zIndex: 1, font: '600 13px/1 var(--font-mono)', color: 'rgba(255,255,255,.4)' }}>—</div>
      <div className="kp-num" style={{ position: 'relative', zIndex: 1, font: `${isTop3?'800':'700'} ${isTop3?36:28}px/1 var(--font-display)`, letterSpacing: '-.03em', textAlign: 'right', color: isTop3 ? '#E77B2E' : '#fff' }}>{row.totalScore}</div>
    </div>
  )
}
