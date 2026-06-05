import { Mark } from './Brand.jsx'

export function CaptchaShell({ kind, title, hint, children, footer }) {
  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
      <div className="kp-captcha">
        <div className="kp-captcha__head">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="kp-eyebrow">{kind}</span>
            <h2 style={{ margin: 0, font: '600 17px/1.25 var(--font-display)', letterSpacing: '-.01em', color: 'var(--c-ink)' }}>
              {title}
            </h2>
            {hint && <p style={{ margin: '2px 0 0', font: '500 12px/1.4 var(--font-display)', color: 'var(--c-ink-500)' }}>{hint}</p>}
          </div>
          <Mark size={28} />
        </div>
        {children}
      </div>
      {footer}
    </div>
  )
}

export function Bottombar({ disabled, label = 'Подтвердить', meta, onClick }) {
  return (
    <div style={{
      position: 'sticky', bottom: 0,
      padding: '12px 16px 22px',
      background: 'linear-gradient(to top, #fff 70%, rgba(255,255,255,0))',
    }}>
      {meta && (
        <div style={{ font: '500 12px/1.2 var(--font-display)', color: 'var(--c-ink-500)', marginBottom: 8, textAlign: 'center' }}>
          {meta}
        </div>
      )}
      <button className="kp-btn kp-btn--primary" style={{ width: '100%', height: 52 }}
        disabled={disabled} onClick={onClick}>
        {label}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M5 12h14M13 6l6 6-6 6" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  )
}
