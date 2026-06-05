import { Logo } from './Brand.jsx'

function fmt(ms) {
  const s = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(s / 60)
  const ss = s % 60
  return `${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`
}

export function PlayerHeader({ index, total, elapsedMs, timeLimitMs, paused }) {
  const pct = total > 0 ? ((index) / total) * 100 : 0
  return (
    <div style={{ padding: '12px 16px 14px', background: '#fff', borderBottom: '1px solid var(--c-line)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <Logo size={20} />
        <div className="kp-timer" style={paused ? { background: 'var(--c-ink-500)' } : undefined}>
          <span className="kp-timer__dot" style={paused ? { background: '#facc15' } : undefined} />
          {paused ? '––' : fmt(elapsedMs)} / {fmt(timeLimitMs)}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="kp-progress" style={{ flex: 1 }}>
          <span style={{ width: `${pct}%` }} />
        </div>
        <span className="kp-num" style={{ font: '600 11px/1 var(--font-display)', color: 'var(--c-ink-500)', letterSpacing: '.04em' }}>
          {String(index).padStart(2,'0')} / {String(total).padStart(2,'0')}
        </span>
      </div>
    </div>
  )
}
