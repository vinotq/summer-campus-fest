/* global React, Mark, Logo, IOSDevice, PlayerHeader, CaptchaShell, Bottombar, PhotoTile */
// Player screens part 2 — slider (detailed), audio, imageCode + score toast.

const { useMemo: useMemoP2 } = React;

// === SCREEN: Slider (the priority one — detailed) =======================
// "Поставьте пылесос в подъезде" — drag an object to the right spot on a photo.

function SliderScreen() {
  // current drag position (normalized 0..1)
  const obj = { x: 0.58, y: 0.62 };

  return (
    <IOSDevice>
      <div style={{ position: 'relative', height: '100%', background: 'var(--c-bg)', display: 'flex', flexDirection: 'column', paddingTop: 50 }}>
        <div className="kp-stripe" />
        <PlayerHeader idx={4} total={7} elapsed="00:14" timeBudget="00:35" />

        <CaptchaShell
          kind="ПОТАЩИТЕ ОБЪЕКТ"
          title="Поставьте пылесос в подъезде"
          hint="Туда, где ему и место — по инструкции коменданта"
        >
          <div style={{ padding: 12 }}>
            {/* the photo */}
            <div style={{
              position: 'relative', borderRadius: 10, overflow: 'hidden',
              aspectRatio: '4 / 5',
              background: 'linear-gradient(180deg,#3c3128 0%,#5a4733 55%,#37291f 100%)'
            }}>
              {/* Faux hallway perspective: floor & wall lines */}
              <svg viewBox="0 0 400 500" preserveAspectRatio="none"
                   style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                {/* far wall */}
                <rect x="0" y="0" width="400" height="250" fill="#2c2118" />
                <rect x="0" y="250" width="400" height="250" fill="#4a3829" />
                {/* perspective lines on floor */}
                <line x1="0" y1="500" x2="200" y2="250" stroke="rgba(255,255,255,.07)" strokeWidth="1"/>
                <line x1="80" y1="500" x2="200" y2="250" stroke="rgba(255,255,255,.05)" strokeWidth="1"/>
                <line x1="160" y1="500" x2="200" y2="250" stroke="rgba(255,255,255,.05)" strokeWidth="1"/>
                <line x1="240" y1="500" x2="200" y2="250" stroke="rgba(255,255,255,.05)" strokeWidth="1"/>
                <line x1="320" y1="500" x2="200" y2="250" stroke="rgba(255,255,255,.05)" strokeWidth="1"/>
                <line x1="400" y1="500" x2="200" y2="250" stroke="rgba(255,255,255,.07)" strokeWidth="1"/>
                {/* radiator on right wall */}
                <g opacity=".5">
                  <rect x="320" y="290" width="60" height="80" fill="#7a5d3e" rx="3"/>
                  {[0,1,2,3,4].map(i => <rect key={i} x={324 + i*11} y="294" width="6" height="72" fill="#5a4530" />)}
                </g>
                {/* doors */}
                <g opacity=".5">
                  <rect x="50" y="220" width="60" height="110" fill="#291f15" rx="2" />
                  <circle cx="100" cy="280" r="3" fill="#a87a3a"/>
                </g>
                {/* baseboard */}
                <line x1="0" y1="252" x2="400" y2="252" stroke="rgba(255,255,255,.12)" strokeWidth="1"/>
                {/* grain */}
              </svg>

              {/* target zone — broadcast as faint dashed circle (not normally shown to player,
                  but we show the tolerance halo while dragging) */}
              <div style={{
                position: 'absolute',
                left: `${0.32 * 100}%`,
                top:  `${0.78 * 100}%`,
                width: 60, height: 60,
                marginLeft: -30, marginTop: -30,
                borderRadius: '50%',
                border: '1.5px dashed rgba(255,255,255,.4)',
                pointerEvents: 'none'
              }} />

              {/* Draggable object — a tiny vacuum illustrated as 2 circles */}
              <div style={{
                position: 'absolute',
                left: `${obj.x * 100}%`,
                top:  `${obj.y * 100}%`,
                transform: 'translate(-50%, -100%)',
                width: 56, height: 76,
                filter: 'drop-shadow(0 6px 14px rgba(0,0,0,.5))'
              }}>
                <svg viewBox="0 0 56 76" width="56" height="76">
                  {/* handle */}
                  <path d="M28 8 C 22 20, 22 32, 28 44" stroke="#E77B2E" strokeWidth="3" fill="none" strokeLinecap="round"/>
                  <circle cx="28" cy="6" r="4" fill="#E77B2E"/>
                  {/* body */}
                  <ellipse cx="28" cy="58" rx="22" ry="14" fill="#E77B2E"/>
                  <ellipse cx="28" cy="55" rx="22" ry="13" fill="#fff" opacity=".15"/>
                  <circle cx="28" cy="58" r="6" fill="#fff"/>
                </svg>
                {/* drag hint pill above object */}
                <div style={{
                  position: 'absolute', left: '50%', top: -30,
                  transform: 'translateX(-50%)',
                  background: '#1f1f1f',
                  color: '#fff',
                  font: '600 10px/1 var(--font-mono)',
                  padding: '5px 7px', borderRadius: 4,
                  whiteSpace: 'nowrap',
                  letterSpacing: '.04em'
                }}>
                  x 0.58 · y 0.62
                </div>
              </div>

              {/* corner hint */}
              <div style={{
                position: 'absolute', left: 8, top: 8,
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(0,0,0,.5)',
                backdropFilter: 'blur(6px)',
                color: '#fff',
                font: '600 10px/1 var(--font-display)',
                letterSpacing: '.06em', textTransform: 'uppercase',
                padding: '5px 8px', borderRadius: 6
              }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M5 9l-3 3 3 3M19 9l3 3-3 3M9 5l3-3 3 3M9 19l3 3 3-3M12 8v8M8 12h8" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
                Перетащите
              </div>
            </div>

            {/* secondary X / Y meters under photo to feel "precise" */}
            <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
              {[
                { label: 'X', val: 0.58 },
                { label: 'Y', val: 0.62 }
              ].map(m => (
                <div key={m.label} style={{ flex: 1 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', font: '600 10px/1 var(--font-display)', color: 'var(--c-ink-500)', letterSpacing: '.08em', marginBottom: 4 }}>
                    <span>{m.label}</span><span className="kp-num">{m.val.toFixed(2)}</span>
                  </div>
                  <div className="kp-progress"><span style={{ width: `${m.val * 100}%` }}></span></div>
                </div>
              ))}
            </div>
          </div>
        </CaptchaShell>

        <Bottombar meta="Ставка 150 очков · ось: обе" label="Поставить здесь" />
      </div>
    </IOSDevice>
  );
}

// === SCREEN: Audio ======================================================

function AudioScreen() {
  // a "playback" waveform — bars with varying heights
  const bars = useMemoP2(() => {
    return Array.from({ length: 56 }, (_, i) => {
      const x = i / 56;
      // synthetic envelope with a peak in the middle
      const env = Math.sin(x * Math.PI);
      const noise = ((Math.sin(i * 17.3) + 1) / 2) * .65 + .35;
      return Math.max(0.08, env * noise);
    });
  }, []);
  const playedTo = 0.62; // 62% played

  return (
    <IOSDevice>
      <div style={{ position: 'relative', height: '100%', background: 'var(--c-bg)', display: 'flex', flexDirection: 'column', paddingTop: 50 }}>
        <div className="kp-stripe" />
        <PlayerHeader idx={5} total={7} elapsed="00:09" timeBudget="00:40" />
        <CaptchaShell
          kind="АУДИО · ТРАНСКРИБИРУЙТЕ"
          title="Что вы слышите?"
          hint="Перепишите ровно так, как звучит. Возможна 1–2 ошибки."
        >
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* player card */}
            <div style={{
              background: 'linear-gradient(135deg, #2a2026 0%, #1d1d2a 100%)',
              borderRadius: 14, padding: 16, color: '#fff', position: 'relative', overflow: 'hidden'
            }}>
              {/* sparkle deco */}
              <Mark size={120} fill="#E77B2E" style={{ position: 'absolute', right: -30, top: -30, opacity: .14 }} />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <span className="kp-eyebrow" style={{ color: 'rgba(255,255,255,.6)' }}>Запись · #4F-002</span>
                <span style={{ font: '600 12px/1 var(--font-mono)' }} className="kp-num">0:02 / 0:04</span>
              </div>

              {/* waveform */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 2, height: 56, marginBottom: 14
              }}>
                {bars.map((b, i) => {
                  const isPlayed = i / bars.length < playedTo;
                  return (
                    <div key={i} style={{
                      width: 3, height: `${b * 100}%`,
                      borderRadius: 2,
                      background: isPlayed ? 'var(--c-orange)' : 'rgba(255,255,255,.25)'
                    }} />
                  );
                })}
              </div>

              {/* controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: '#fff', border: 0, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <rect x="5" y="4" width="5" height="16" fill="#1f1f1f" rx="1"/>
                    <rect x="14" y="4" width="5" height="16" fill="#1f1f1f" rx="1"/>
                  </svg>
                </button>
                <button style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'rgba(255,255,255,.12)', border: 0, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                <span style={{ marginLeft: 'auto', font: '500 12px/1 var(--font-display)', color: 'rgba(255,255,255,.6)' }}>
                  Можно 2 прослушивания
                </span>
              </div>
            </div>

            {/* input */}
            <div>
              <label className="kp-eyebrow">ВАШ ВАРИАНТ</label>
              <div style={{ position: 'relative', marginTop: 6 }}>
                <input
                  className="kp-input"
                  defaultValue="внимание, эвакуа"
                  style={{ paddingRight: 60, fontFamily: 'var(--font-mono)', fontSize: 15 }}
                />
                <div style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  font: '500 11px/1 var(--font-display)', color: 'var(--c-ink-400)'
                }} className="kp-num">17 / 80</div>
              </div>
              <div style={{
                marginTop: 8,
                display: 'flex', gap: 8, alignItems: 'center',
                font: '500 11px/1.3 var(--font-display)', color: 'var(--c-ink-500)'
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/><path d="M12 8v5M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                Допустимо до 2 опечаток. Запятые и регистр не важны.
              </div>
            </div>
          </div>
        </CaptchaShell>

        <Bottombar label="Отправить ответ" />
      </div>
    </IOSDevice>
  );
}

// === SCREEN: imageCode ===================================================

function ImageCodeScreen() {
  return (
    <IOSDevice>
      <div style={{ position: 'relative', height: '100%', background: 'var(--c-bg)', display: 'flex', flexDirection: 'column', paddingTop: 50 }}>
        <div className="kp-stripe" />
        <PlayerHeader idx={6} total={7} elapsed="00:05" timeBudget="00:20" />
        <CaptchaShell
          kind="КОД С КАРТИНКИ"
          title="Введите символы с фотографии"
          hint="Заглавные/строчные не важны"
        >
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* "distorted code" photo */}
            <div style={{
              position: 'relative', height: 130, borderRadius: 10,
              background: 'linear-gradient(135deg,#f7d9b3 0%,#e7a87a 100%)',
              overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {/* noise lines */}
              <svg viewBox="0 0 400 130" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                {Array.from({ length: 20 }, (_, i) => (
                  <line key={i}
                    x1={i * 23} y1={(i * 17) % 130}
                    x2={i * 23 + 80} y2={((i + 3) * 31) % 130}
                    stroke="rgba(65,65,65,.18)" strokeWidth="1.5" />
                ))}
              </svg>
              {/* the "code" with rotated chars */}
              <div style={{ display: 'flex', gap: 4, position: 'relative', zIndex: 1 }}>
                {[
                  ['K', -8, '#2a1a18'],
                  ['7', 12, '#3a2a18'],
                  ['Q', -4, '#1f1f1f'],
                  ['9', 16, '#2a201a']
                ].map(([ch, rot, col], i) => (
                  <span key={i} style={{
                    display: 'inline-block',
                    font: `800 56px/1 var(--font-display)`,
                    color: col,
                    transform: `rotate(${rot}deg) translateY(${i % 2 ? -2 : 4}px)`,
                    letterSpacing: '-.04em',
                    textShadow: '0 2px 0 rgba(255,255,255,.3)'
                  }}>{ch}</span>
                ))}
              </div>
              {/* corner stamp */}
              <div style={{
                position: 'absolute', right: 10, bottom: 8,
                font: '700 9px/1 var(--font-mono)',
                color: 'rgba(65,65,65,.6)',
                letterSpacing: '.1em'
              }}>СПРАВКА · АКТ-0419</div>
            </div>

            {/* input with monospaced caret */}
            <div>
              <label className="kp-eyebrow">КОД</label>
              <input
                className="kp-input"
                defaultValue="K7q"
                style={{
                  marginTop: 6,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 22,
                  letterSpacing: '.5em',
                  textTransform: 'uppercase',
                  textAlign: 'center',
                  height: 64
                }}
                maxLength={6}
              />
              <button style={{
                marginTop: 10,
                background: 'transparent', border: 0, padding: 0,
                font: '600 12px/1 var(--font-display)', color: 'var(--c-purple)',
                display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer'
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Не вижу — попросить другой код
              </button>
            </div>
          </div>
        </CaptchaShell>
        <Bottombar label="Подтвердить" />
      </div>
    </IOSDevice>
  );
}

// === SCREEN: score toast (mid-flow celebration) ==========================

function ScoreToastScreen() {
  return (
    <IOSDevice>
      <div style={{ position: 'relative', height: '100%', background: 'var(--c-bg)', display: 'flex', flexDirection: 'column', paddingTop: 50 }}>
        <div className="kp-stripe" />
        <PlayerHeader idx={3} total={7} elapsed="00:18" />
        {/* dimmed background of the previous question */}
        <div style={{ opacity: .35, pointerEvents: 'none', filter: 'blur(2px) saturate(.8)' }}>
          <CaptchaShell kind="ВЫБЕРИТЕ ВСЕ ПОДХОДЯЩИЕ" title="Выберите просроченные продукты">
            <div style={{ padding: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} style={{ aspectRatio: '1' }}>
                    <PhotoTile seed={i + 1} style={{ width: '100%', height: '100%' }} />
                  </div>
                ))}
              </div>
            </div>
          </CaptchaShell>
        </div>

        {/* The celebration card */}
        <div style={{
          position: 'absolute',
          left: 0, right: 0, top: '38%',
          display: 'flex', justifyContent: 'center'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 20,
            padding: '28px 28px 24px',
            boxShadow: 'var(--shadow-pop)',
            border: '1px solid var(--c-line)',
            width: 280,
            textAlign: 'center',
            position: 'relative'
          }}>
            {/* big mark behind */}
            <Mark size={56} style={{ marginBottom: 8 }} />
            <div style={{
              font: '800 64px/.95 var(--font-display)',
              letterSpacing: '-.04em',
              background: 'var(--grad)',
              WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'
            }}>+80</div>
            <div style={{ font: '600 13px/1 var(--font-display)', color: 'var(--c-ink-500)', marginTop: 2 }}>очков</div>

            <div style={{
              marginTop: 16, padding: '10px 0',
              borderTop: '1px solid var(--c-line-soft)',
              borderBottom: '1px solid var(--c-line-soft)',
              display: 'flex', justifyContent: 'space-around',
              font: '500 11px/1 var(--font-display)', color: 'var(--c-ink-500)'
            }}>
              <div>
                <div className="kp-num" style={{ font: '700 16px/1 var(--font-display)', color: 'var(--c-ink)' }}>12с</div>
                <div style={{ marginTop: 4 }}>время</div>
              </div>
              <div style={{ width: 1, background: 'var(--c-line-soft)' }} />
              <div>
                <div className="kp-num" style={{ font: '700 16px/1 var(--font-display)', color: 'var(--ok)' }}>3/3</div>
                <div style={{ marginTop: 4 }}>точно</div>
              </div>
              <div style={{ width: 1, background: 'var(--c-line-soft)' }} />
              <div>
                <div className="kp-num" style={{ font: '700 16px/1 var(--font-display)', color: 'var(--c-ink)' }}>180</div>
                <div style={{ marginTop: 4 }}>всего</div>
              </div>
            </div>

            <div style={{ marginTop: 14, font: '500 12px/1.4 var(--font-display)', color: 'var(--c-ink-500)' }}>
              Следующий вопрос загружается…
            </div>

            <div className="kp-progress" style={{ marginTop: 10 }}>
              <span style={{ width: '65%' }}></span>
            </div>
          </div>
        </div>
      </div>
    </IOSDevice>
  );
}

Object.assign(window, { SliderScreen, AudioScreen, ImageCodeScreen, ScoreToastScreen });
