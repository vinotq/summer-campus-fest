/* global React, Mark, Logo, ChromeWindow */
// Admin screens — login, /admin/players (dense), /admin/questions (airy).

// === shared admin chrome =================================================

function AdminSidebar({ active = 'players' }) {
  const items = [
    { id: 'players',   label: 'Игроки',     count: 47, icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.87M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM16 3.13a4 4 0 0 1 0 7.75' },
    { id: 'questions', label: 'Вопросы',    count: 12, icon: 'M9 11h6M9 15h4M5 21l-1-3V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6l-1 1z' },
    { id: 'dashboard', label: 'Дашборд',    badge: 'live', icon: 'M3 13l9-9 9 9M5 11v9h4v-6h6v6h4v-9' },
  ];
  return (
    <aside className="kp-side">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 6px 18px' }}>
        <Logo size={18} />
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {items.map(it => (
          <div key={it.id} className={`kp-nav__item ${active === it.id ? 'kp-nav__item--active' : ''}`}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d={it.icon} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ flex: 1 }}>{it.label}</span>
            {it.count != null && (
              <span style={{
                font: '600 10.5px/1 var(--font-mono)',
                color: active === it.id ? 'rgba(255,255,255,.7)' : 'var(--c-ink-400)'
              }}>{it.count}</span>
            )}
            {it.badge && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                font: '700 9px/1 var(--font-display)', letterSpacing: '.1em',
                color: '#c83a3a', textTransform: 'uppercase'
              }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#c83a3a' }} />
                LIVE
              </span>
            )}
          </div>
        ))}
      </nav>

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* live status */}
        <div style={{
          padding: 10,
          background: 'var(--c-line-soft)', borderRadius: 8,
          font: '500 11px/1.3 var(--font-display)', color: 'var(--c-ink-500)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--c-ok)', boxShadow: '0 0 0 3px rgba(47,138,77,.18)' }} />
            <b style={{ color: 'var(--c-ink-700)' }}>Сокет жив</b>
          </div>
          14 онлайн · последний пинг 0.4с
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 8px', borderRadius: 8,
          font: '500 12px/1 var(--font-display)', color: 'var(--c-ink-700)',
          cursor: 'pointer'
        }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--c-ink-700)', color: '#fff', font: '700 11px/1 var(--font-display)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>А</div>
          admin
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ marginLeft: 'auto' }}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      </div>
    </aside>
  );
}

function AdminTopbar({ title, subtitle, right }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      padding: '18px 24px 14px', borderBottom: '1px solid var(--c-line)',
      background: '#fff'
    }}>
      <div>
        <h1 style={{ margin: 0, font: '700 22px/1.1 var(--font-display)', letterSpacing: '-.02em' }}>{title}</h1>
        {subtitle && <div style={{ marginTop: 4, font: '500 12.5px/1 var(--font-display)', color: 'var(--c-ink-500)' }}>{subtitle}</div>}
      </div>
      {right}
    </div>
  );
}

// === SCREEN: /admin/login ===============================================

function AdminLoginScreen() {
  return (
    <ChromeWindow width={1100} height={680} url="kapcha.campusfest.ru/admin/login">
      <div style={{
        position: 'relative',
        width: '100%', height: '100%',
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        background: '#fff', overflow: 'hidden'
      }}>
        {/* left — form */}
        <div style={{ padding: '64px 64px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Logo size={22} />
          <h1 style={{
            margin: '40px 0 6px',
            font: '700 36px/1 var(--font-display)',
            letterSpacing: '-.03em'
          }}>Админка станции</h1>
          <p style={{ margin: '0 0 32px', font: '500 14px/1.4 var(--font-display)', color: 'var(--c-ink-500)', maxWidth: 380 }}>
            Только для тех, кто знает пароль из&nbsp;<code style={{ font: '500 13px/1 var(--font-mono)', background: 'var(--c-line-soft)', padding: '2px 6px', borderRadius: 4 }}>.env</code>. Игроков сюда не пускаем.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 380 }}>
            <div>
              <label style={{ font: '600 12px/1 var(--font-display)', color: 'var(--c-ink-700)' }}>Логин</label>
              <input className="kp-input" defaultValue="admin" style={{ marginTop: 6 }} />
            </div>
            <div>
              <label style={{ font: '600 12px/1 var(--font-display)', color: 'var(--c-ink-700)' }}>Пароль</label>
              <input className="kp-input" type="password" defaultValue="•••••••••" style={{ marginTop: 6 }} />
            </div>
            <button className="kp-btn kp-btn--primary" style={{ marginTop: 12, height: 50 }}>
              Войти
            </button>
          </div>

          <div style={{ marginTop: 24, font: '500 11px/1.4 var(--font-display)', color: 'var(--c-ink-400)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" stroke="currentColor" strokeWidth="1.5" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="1.5"/></svg>
            HMAC-куки на 12 часов. Одна сессия — один админ.
          </div>
        </div>

        {/* right — branded panel */}
        <div style={{
          position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(160deg,#814387 0%,#5a2f60 55%,#E77B2E 110%)',
          color: '#fff'
        }}>
          <Mark size={520} fill="#fff" style={{ position: 'absolute', right: -120, bottom: -160, opacity: .14 }} />
          <Mark size={170} fill="#fff" style={{ position: 'absolute', left: 40, top: 60, opacity: .22 }} />

          <div style={{ position: 'absolute', left: 48, bottom: 48, right: 48 }}>
            <div style={{
              font: '600 11px/1 var(--font-display)',
              letterSpacing: '.18em', textTransform: 'uppercase', opacity: .8, marginBottom: 10
            }}>Сириус.Капча · v1.0</div>
            <div style={{ font: '700 30px/1.05 var(--font-display)', letterSpacing: '-.025em', maxWidth: 400 }}>
              «Подтвердите, что вы&nbsp;не&nbsp;робот, прежде чем попасть в&nbsp;общагу»
            </div>
            <div style={{
              marginTop: 18, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,.2)',
              display: 'flex', gap: 24, font: '500 12px/1.3 var(--font-display)', opacity: .85
            }}>
              <div><b style={{ display: 'block', font: '700 20px/1 var(--font-display)' }}>47</b>сегодня</div>
              <div><b style={{ display: 'block', font: '700 20px/1 var(--font-display)' }}>14</b>сейчас</div>
              <div><b style={{ display: 'block', font: '700 20px/1 var(--font-display)' }}>880</b>топ-1</div>
            </div>
          </div>
        </div>
      </div>
    </ChromeWindow>
  );
}

Object.assign(window, { AdminSidebar, AdminTopbar, AdminLoginScreen });
