/* global React, Mark, Logo, MarkField, IOSDevice */
// Player-facing mobile screens.
// Five captcha types + start + per-question result toast + final card.

const { useState, useMemo } = React;

// === Shared UI inside player screens ====================================

function PlayerHeader({ idx, total, elapsed = '00:24', timeBudget = '00:40' }) {
  const pct = (idx / total) * 100;
  return (
    <div style={{ padding: '12px 16px 14px', background: '#fff', borderBottom: '1px solid var(--c-line)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <Logo size={20} />
        <div className="kp-timer">
          <span className="kp-timer__dot"></span>
          {elapsed} / {timeBudget}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="kp-progress" style={{ flex: 1 }}>
          <span style={{ width: `${pct}%` }}></span>
        </div>
        <span className="kp-num" style={{ font: '600 11px/1 var(--font-display)', color: 'var(--c-ink-500)', letterSpacing: '.04em' }}>
          {String(idx).padStart(2,'0')} / {String(total).padStart(2,'0')}
        </span>
      </div>
    </div>
  );
}

function CaptchaShell({ kind, title, hint, children, footer }) {
  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
      <div className="kp-captcha">
        <div className="kp-captcha__head">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="kp-eyebrow">{kind}</span>
            <h2 style={{ margin: 0, font: '600 17px/1.25 var(--font-display)', letterSpacing: '-.01em', color: 'var(--c-ink)' }}>
              {title}
            </h2>
            {hint && (
              <p style={{ margin: '2px 0 0', font: '500 12px/1.4 var(--font-display)', color: 'var(--c-ink-500)' }}>{hint}</p>
            )}
          </div>
          <Mark size={28} />
        </div>
        {children}
      </div>
      {footer}
    </div>
  );
}

function Bottombar({ disabled, label = 'Подтвердить', meta }) {
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0,
      padding: '12px 16px 22px',
      background: 'linear-gradient(to top, #fff 70%, rgba(255,255,255,0))',
    }}>
      {meta && (
        <div style={{ font: '500 12px/1.2 var(--font-display)', color: 'var(--c-ink-500)', marginBottom: 8, textAlign: 'center' }}>
          {meta}
        </div>
      )}
      <button
        className="kp-btn kp-btn--primary"
        style={{ width: '100%', height: 52, opacity: disabled ? .4 : 1 }}
      >
        {label}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
    </div>
  );
}

// === Mock "photo" — washes + tiny icon for captcha tiles ===============

// deterministic warm/cool washes so tiles look like distinct photos
const TILE_PALETTES = [
  ['#3a2a23', '#7c4f33'], // muddy brown
  ['#4a3b2a', '#a37147'], // tan
  ['#2c3a2d', '#5a7350'], // mossy
  ['#3b3247', '#7a5e8c'], // plum
  ['#42332a', '#b46e3a'], // amber
  ['#2a2f3a', '#4f5e7a'], // dusk
  ['#3a2823', '#8c4a3a'], // brick
  ['#383224', '#7a6532'], // mustard
  ['#2e2a3a', '#5b4d75'], // mauve
  ['#1e2a2a', '#3d6360'], // teal
];

function PhotoTile({ seed = 0, label, icon, style, children }) {
  const [a, b] = TILE_PALETTES[seed % TILE_PALETTES.length];
  return (
    <div style={{
      position: 'relative',
      borderRadius: 8,
      overflow: 'hidden',
      background: `radial-gradient(120% 90% at 30% 25%, ${b} 0%, ${a} 75%)`,
      color: '#fff',
      ...style
    }}>
      {/* grain */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(rgba(255,255,255,.08) 1px, transparent 1px)',
        backgroundSize: '3px 3px',
        mixBlendMode: 'overlay',
        pointerEvents: 'none'
      }} />
      {icon && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          font: '500 28px/1 var(--font-display)',
          opacity: .92,
          letterSpacing: '-.02em'
        }}>{icon}</div>
      )}
      {label && (
        <div style={{
          position: 'absolute', left: 6, bottom: 6,
          font: '600 9.5px/1 var(--font-mono)',
          letterSpacing: '.06em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,.78)',
          textShadow: '0 1px 1px rgba(0,0,0,.35)'
        }}>{label}</div>
      )}
      {children}
    </div>
  );
}

// === SCREEN: Start ======================================================

function StartScreen() {
  return (
    <IOSDevice>
      <div style={{ position: 'relative', height: '100%', background: 'var(--c-bg)', display: 'flex', flexDirection: 'column', paddingTop: 50 }}>
        <div className="kp-stripe" />
        <div style={{ padding: '18px 16px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Logo size={20} />
          <span className="kp-chip kp-chip--purple">Стенд КампусФеста</span>
        </div>

        {/* Big hero — slight festival flourish */}
        <div style={{ padding: '24px 16px 8px', position: 'relative' }}>
          <Mark size={64} style={{ marginBottom: 12 }} />
          <h1 style={{
            margin: 0,
            font: '700 38px/.95 var(--font-display)',
            letterSpacing: '-.035em',
            color: 'var(--c-ink)'
          }}>
            Подтвердите,<br />
            что вы не<br />
            <span style={{
              background: 'var(--grad)',
              WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'
            }}>бот-студент</span>
          </h1>
          <p style={{ margin: '14px 0 0', font: '500 14px/1.45 var(--font-display)', color: 'var(--c-ink-500)', maxWidth: 300 }}>
            7 капч на бытовую логику общежития. На всё — 4:30. Чем быстрее ответ, тем больше очков.
          </p>
        </div>

        {/* Form */}
        <div style={{ padding: '24px 16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={{ font: '600 12px/1 var(--font-display)', color: 'var(--c-ink-700)' }}>Фамилия</label>
          <input className="kp-input" defaultValue="Иванов" />
          <label style={{ font: '600 12px/1 var(--font-display)', color: 'var(--c-ink-700)', marginTop: 4 }}>Имя</label>
          <input className="kp-input" placeholder="Пётр" />
        </div>

        {/* footer */}
        <div style={{ marginTop: 'auto', padding: '16px 16px 28px' }}>
          <button className="kp-btn kp-btn--primary" style={{ width: '100%', height: 56, font: '700 16px/1 var(--font-display)' }}>
            Начать капчу
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 8, marginTop: 12,
            font: '500 11px/1.2 var(--font-display)', color: 'var(--c-ink-400)'
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
            Только одна попытка — выкладывайтесь
          </div>
        </div>
      </div>
    </IOSDevice>
  );
}

// === SCREEN: grid3x3 =====================================================

function Grid3x3Screen() {
  // 9 tiles, mark which are "selected" and which are correct (correct shown in admin overlays only)
  const tiles = [
    { icon: '🥛', label: 'FRIDGE-01', selected: true },   // expired milk
    { icon: '🥬', label: 'FRIDGE-02', selected: false },
    { icon: '🧀', label: 'FRIDGE-03', selected: true },   // moldy cheese
    { icon: '🍎', label: 'FRIDGE-04', selected: false },
    { icon: '🥚', label: 'FRIDGE-05', selected: false },
    { icon: '🍕', label: 'FRIDGE-06', selected: true },   // ancient pizza
    { icon: '🥕', label: 'FRIDGE-07', selected: false },
    { icon: '🍞', label: 'FRIDGE-08', selected: false },
    { icon: '🍗', label: 'FRIDGE-09', selected: false },
  ];
  return (
    <IOSDevice>
      <div style={{ position: 'relative', height: '100%', background: 'var(--c-bg)', display: 'flex', flexDirection: 'column', paddingTop: 50 }}>
        <div className="kp-stripe" />
        <PlayerHeader idx={2} total={7} elapsed="00:08" timeBudget="00:30" />
        <CaptchaShell
          kind="ВЫБЕРИТЕ ВСЕ ПОДХОДЯЩИЕ"
          title="Выберите просроченные продукты"
          hint="Те, что нашли в общем холодильнике на прошлой неделе"
        >
          <div style={{ padding: 12 }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3,1fr)',
              gap: 6
            }}>
              {tiles.map((t, i) => (
                <div key={i} style={{ position: 'relative', aspectRatio: '1' }}>
                  <PhotoTile seed={i + 1} icon={t.icon} label={t.label} style={{ width: '100%', height: '100%' }} />
                  {/* selection ring */}
                  {t.selected && (
                    <div style={{
                      position: 'absolute', inset: 0,
                      borderRadius: 8,
                      boxShadow: 'inset 0 0 0 3px #fff, inset 0 0 0 6px var(--c-purple)',
                      pointerEvents: 'none'
                    }} />
                  )}
                  {t.selected && (
                    <div style={{
                      position: 'absolute', top: 6, right: 6,
                      width: 22, height: 22, borderRadius: '50%',
                      background: 'var(--c-purple)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 2px 6px rgba(0,0,0,.25)'
                    }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
              <span style={{ font: '500 12px/1 var(--font-display)', color: 'var(--c-ink-500)' }}>
                Выбрано: <b style={{ color: 'var(--c-ink)' }}>3</b>
              </span>
              <button style={{
                background: 'none', border: 0, padding: 0,
                font: '600 12px/1 var(--font-display)', color: 'var(--c-ink-500)',
                display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer'
              }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Сбросить
              </button>
            </div>
          </div>
        </CaptchaShell>
        <Bottombar meta="3 правильных · ставка 100 очков" />
      </div>
    </IOSDevice>
  );
}

// === SCREEN: tiles =======================================================

function TilesScreen() {
  // 4×4 grid over a single photo. Mark cells 2, 5, 8, 9 as selected.
  const selected = new Set([2, 5, 8, 9]);
  return (
    <IOSDevice>
      <div style={{ position: 'relative', height: '100%', background: 'var(--c-bg)', display: 'flex', flexDirection: 'column', paddingTop: 50 }}>
        <div className="kp-stripe" />
        <PlayerHeader idx={3} total={7} elapsed="00:11" timeBudget="00:45" />
        <CaptchaShell
          kind="ВЫБЕРИТЕ ВСЕ КЛЕТКИ"
          title="Велосипеды припаркованы правильно"
          hint="Только те, что в стойке, не у двери и не на газоне"
        >
          <div style={{ padding: 12 }}>
            <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', aspectRatio: '4 / 3' }}>
              {/* big photo */}
              <PhotoTile seed={4} icon={null} style={{ width: '100%', height: '100%' }}>
                {/* faux bicycle silhouettes scattered */}
                <svg viewBox="0 0 400 300" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                  {[
                    [60,200],[140,200],[220,205],[300,200],
                    [80,90],[200,110],[330,95],[110,260]
                  ].map(([cx,cy],i) => (
                    <g key={i} opacity={.55} transform={`translate(${cx-25} ${cy-15})`}>
                      <circle cx="8" cy="20" r="9" stroke="#fff" strokeWidth="2" fill="none"/>
                      <circle cx="42" cy="20" r="9" stroke="#fff" strokeWidth="2" fill="none"/>
                      <path d="M8 20 L25 6 L42 20 L25 6 L18 6" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round"/>
                    </g>
                  ))}
                </svg>
              </PhotoTile>
              {/* 4×4 grid overlay */}
              <div style={{
                position: 'absolute', inset: 0,
                display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gridTemplateRows: 'repeat(4,1fr)'
              }}>
                {Array.from({ length: 16 }, (_, i) => {
                  const isSel = selected.has(i);
                  return (
                    <div key={i} style={{
                      borderRight: (i % 4 < 3) ? '1px solid rgba(255,255,255,.25)' : 'none',
                      borderBottom: (i < 12) ? '1px solid rgba(255,255,255,.25)' : 'none',
                      background: isSel ? 'rgba(129,67,135,.55)' : 'transparent',
                      position: 'relative',
                      transition: 'background .15s'
                    }}>
                      {isSel && (
                        <div style={{
                          position: 'absolute', top: 4, right: 4,
                          width: 18, height: 18, borderRadius: '50%',
                          background: '#fff', color: 'var(--c-purple)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
              <span style={{ font: '500 12px/1 var(--font-display)', color: 'var(--c-ink-500)' }}>
                Сетка 4×4 · выбрано <b style={{ color: 'var(--c-ink)' }}>4</b>
              </span>
              <span style={{ font: '500 12px/1 var(--font-display)', color: 'var(--c-ink-500)' }}>
                Тапайте по клеткам
              </span>
            </div>
          </div>
        </CaptchaShell>
        <Bottombar />
      </div>
    </IOSDevice>
  );
}

Object.assign(window, { StartScreen, Grid3x3Screen, TilesScreen, PlayerHeader, CaptchaShell, Bottombar, PhotoTile });
