import { useState, useRef, useCallback, useEffect } from 'react'

// ===== grid3x3 =====
export function Grid3x3Question({ question, onAnswer, disabled }) {
  const { publicView } = question
  const [selected, setSelected] = useState(new Set())
  const toggle = (i) => { if (disabled) return; setSelected(s => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n }) }

  return (
    <>
      <div style={{ padding: '8px 8px 4px' }}>
        {/* Увеличенные плитки — gap 5, без лишних отступов */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 5 }}>
          {publicView.tiles.map((t, i) => {
            const sel = selected.has(i)
            return (
              <div key={i} style={{ position: 'relative', aspectRatio: '1', cursor: 'pointer' }} onClick={() => toggle(i)}>
                <div style={{
                  width: '100%', height: '100%', borderRadius: 8, overflow: 'hidden',
                  background: `radial-gradient(120% 90% at 30% 25%, ${PALETTES[(i+1)%PALETTES.length][1]} 0%, ${PALETTES[(i+1)%PALETTES.length][0]} 75%)`,
                }}>
                  <img src={t.assetUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { e.target.style.display='none' }} />
                </div>
                {sel && <>
                  <div style={{ position: 'absolute', inset: 0, borderRadius: 8, boxShadow: 'inset 0 0 0 3px #fff, inset 0 0 0 6px var(--c-purple)', pointerEvents: 'none' }} />
                  <div style={{ position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: '50%', background: 'var(--c-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,.25)' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                </>}
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
          <span style={{ font: '500 12px/1 var(--font-display)', color: 'var(--c-ink-500)' }}>
            Выбрано: <b style={{ color: 'var(--c-ink)' }}>{selected.size}</b>
          </span>
          <button style={{ background: 'none', border: 0, padding: 0, font: '600 12px/1 var(--font-display)', color: 'var(--c-ink-500)', cursor: 'pointer' }}
            onClick={() => setSelected(new Set())}>Сбросить</button>
        </div>
      </div>
      <SubmitBar label="Подтвердить" disabled={disabled}
        onSubmit={() => onAnswer({ selected: [...selected] })} />
    </>
  )
}

// ===== tiles =====
export function TilesQuestion({ question, onAnswer, disabled }) {
  const { publicView } = question
  const { cols, rows } = publicView.grid
  const total = cols * rows
  const [selected, setSelected] = useState(new Set())
  const toggle = (i) => setSelected(s => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n })

  return (
    <>
      <div style={{ padding: 12 }}>
        <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', background: '#2c3a2d' }}>
          <img src={publicView.assetUrl} alt="" style={{ width: '100%', height: 'auto', display: 'block' }}
            onError={e => { e.target.style.display='none' }} />
          <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: `repeat(${cols},1fr)`, gridTemplateRows: `repeat(${rows},1fr)` }}>
            {Array.from({ length: total }, (_, i) => {
              const sel = selected.has(i)
              return (
                <div key={i} style={{
                  borderRight: (i % cols < cols-1) ? '1px solid rgba(255,255,255,.25)' : 'none',
                  borderBottom: (i < total - cols) ? '1px solid rgba(255,255,255,.25)' : 'none',
                  background: sel ? 'rgba(129,67,135,.55)' : 'transparent',
                  position: 'relative', cursor: disabled ? 'default' : 'pointer',
                }} onClick={() => !disabled && toggle(i)}>
                  {sel && (
                    <div style={{ position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: '50%', background: '#fff', color: 'var(--c-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
          <span style={{ font: '500 12px/1 var(--font-display)', color: 'var(--c-ink-500)' }}>
            Сетка {cols}×{rows} · выбрано <b style={{ color: 'var(--c-ink)' }}>{selected.size}</b>
          </span>
          <span style={{ font: '500 12px/1 var(--font-display)', color: 'var(--c-ink-500)' }}>Тапайте по клеткам</span>
        </div>
      </div>
      <SubmitBar disabled={disabled} onSubmit={() => onAnswer({ selected: [...selected] })} />
    </>
  )
}

// ===== slider (puzzle-style) =====
// Горизонтальный пазл: тянем кусочек слева направо до совпадения с дыркой.
export function SliderQuestion({ question, onAnswer, disabled }) {
  const { publicView } = question
  const PIECE_W = 56  // ширина кусочка в px (внутри нормированного пространства)

  const trackRef = useRef(null)
  const dragging = useRef(false)
  const startX = useRef(0)
  const startVal = useRef(0)
  const [val, setVal] = useState(0)   // 0..1, позиция большого пальца
  const [released, setReleased] = useState(false)

  // Конвертируем clientX в значение 0..1 вдоль трека
  function clientToVal(clientX) {
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect) return val
    const thumbW = 48
    const travel = rect.width - thumbW
    return Math.max(0, Math.min(1, (clientX - rect.left - thumbW / 2) / travel))
  }

  function onPointerDown(e) {
    e.preventDefault()
    dragging.current = true
    startX.current = e.clientX
    startVal.current = val
    setReleased(false)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  }

  function onPointerMove(e) {
    if (!dragging.current) return
    setVal(clientToVal(e.clientX))
  }

  function onPointerUp(e) {
    dragging.current = false
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
    setReleased(true)
  }

  useEffect(() => () => {
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
  }, [])

  const pieceY = publicView.pieceY ?? 0.5
  const pieceW = publicView.objectWidth ?? 56
  const pieceH = publicView.objectHeight ?? 56
  const pieceLeftPct = val * 100

  // Цвет дорожки заполнения
  const trackFill = released ? 'var(--grad)' : 'var(--c-purple)'

  return (
    <div style={{ padding: '12px 12px 0' }}>
      {/* Фото с кусочком — натуральные пропорции изображения */}
      <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: '#e0dbd4', userSelect: 'none' }}>
        {publicView.backgroundUrl
          ? <img src={publicView.backgroundUrl} alt="" style={{ width: '100%', height: 'auto', display: 'block' }} />
          : <PlaceholderBg />
        }

        {/* Скользящий кусочек — top берётся из pieceY, заданного админом */}
        <div style={{
          position: 'absolute',
          top: `${pieceY * 100}%`,
          left: `${pieceLeftPct}%`,
          transform: 'translate(-50%, -50%)',
          transition: dragging.current ? 'none' : 'left .05s',
          filter: 'drop-shadow(0 4px 12px rgba(0,0,0,.45))',
          pointerEvents: 'none',
          zIndex: 2,
        }}>
          {publicView.objectUrl
            ? <img src={publicView.objectUrl} alt="" style={{ width: pieceW, height: pieceH, objectFit: 'contain' }} />
            : <PuzzlePiece />
          }
        </div>

      </div>

      {/* Slider track */}
      <div style={{ padding: '16px 0 4px' }}>
        <div ref={trackRef} style={{
          position: 'relative',
          height: 48,
          background: 'var(--c-line-soft)',
          borderRadius: 999,
          border: '1px solid var(--c-line)',
          overflow: 'hidden',
          cursor: 'pointer',
        }}>
          {/* Fill */}
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: `calc(${val * 100}% + 24px)`,
            background: `linear-gradient(90deg, rgba(129,67,135,.15), rgba(129,67,135,.06))`,
            borderRadius: 999,
            transition: dragging.current ? 'none' : 'width .05s',
          }} />

          {/* Track text */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            font: '500 12px/1 var(--font-display)', color: 'var(--c-ink-400)',
            letterSpacing: '.04em', pointerEvents: 'none',
            opacity: val > 0.1 ? 0 : 1, transition: 'opacity .2s',
          }}>
            → Потяните сюда
          </div>

          {/* Thumb */}
          <div
            onPointerDown={onPointerDown}
            style={{
              position: 'absolute',
              top: 4, bottom: 4,
              left: `calc(${val * 100}% - ${val * 40}px)`,
              width: 40,
              background: 'var(--grad)',
              borderRadius: 999,
              boxShadow: '0 2px 10px rgba(129,67,135,.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'grab',
              transition: dragging.current ? 'none' : 'left .05s',
              touchAction: 'none',
              zIndex: 1,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M12 6l6 6-6 6" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      <SubmitBar
        label="Подтвердить"
        disabled={disabled || val < 0.02}
        onSubmit={() => onAnswer({ x: val, y: 0.5 })}
      />
    </div>
  )
}

function PuzzlePiece() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56">
      <defs>
        <linearGradient id="pg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E77B2E"/>
          <stop offset="100%" stopColor="#814387"/>
        </linearGradient>
      </defs>
      {/* puzzle piece shape */}
      <path d="M8 8 h12 c0-5 8-5 8 0 h12 v12 c5 0 5 8 0 8 v12 h-12 c0 5-8 5-8 0 h-12 v-12 c-5 0-5-8 0-8 z"
        fill="url(#pg)" stroke="rgba(255,255,255,.3)" strokeWidth="1" />
    </svg>
  )
}

function PlaceholderBg() {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#e8e0f5,#f5e8d8)', flexDirection: 'column', gap: 8 }}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" stroke="var(--c-ink-300)" strokeWidth="1.5" rx="2"/><circle cx="8.5" cy="10.5" r="1.5" fill="var(--c-ink-300)"/><path d="M21 16l-5-5-9 9" stroke="var(--c-ink-300)" strokeWidth="1.5"/></svg>
      <span style={{ font: '500 12px/1 var(--font-display)', color: 'var(--c-ink-400)' }}>Загрузите фон в редакторе</span>
    </div>
  )
}

// ===== audio =====
const MAX_PLAYS = 3

export function AudioQuestion({ question, onAnswer, disabled }) {
  const { publicView } = question
  const [text, setText] = useState('')
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [plays, setPlays] = useState(0)     // play sessions started
  const [audioEnded, setAudioEnded] = useState(true)  // false = paused mid-play

  const isButtonDisabled = !playing && plays >= MAX_PLAYS && audioEnded

  function togglePlay() {
    if (!audioRef.current) return
    if (playing) {
      audioRef.current.pause()
      setPlaying(false)
      // audioEnded stays false — paused, not ended
    } else {
      if (isButtonDisabled) return
      audioRef.current.play()
      setPlaying(true)
      if (audioEnded) {  // new play session (not resume from pause)
        setPlays(p => p + 1)
        setAudioEnded(false)
      }
    }
  }

  function handleEnded() {
    setPlaying(false)
    setAudioEnded(true)
  }

  const playsLabel = plays === 0
    ? 'Нажмите ▶'
    : plays >= MAX_PLAYS && audioEnded
      ? `Прослушано: ${plays}/${MAX_PLAYS}`
      : `Прослушано: ${plays}/${MAX_PLAYS}`

  return (
    <>
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <audio ref={audioRef} src={publicView.audioUrl} onEnded={handleEnded} />
        <div style={{ background: 'linear-gradient(135deg, #2a2026 0%, #1d1d2a 100%)', borderRadius: 14, padding: 16, color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span className="kp-eyebrow" style={{ color: 'rgba(255,255,255,.6)' }}>Аудио</span>
            <span style={{ font: '600 12px/1 var(--font-mono)' }} className="kp-num">{playsLabel}</span>
          </div>
          <WaveformViz playing={playing} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14 }}>
            <button onClick={togglePlay} disabled={isButtonDisabled}
              style={{ width: 44, height: 44, borderRadius: '50%', background: isButtonDisabled ? 'rgba(255,255,255,.3)' : '#fff', border: 0, cursor: isButtonDisabled ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {playing
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="5" y="4" width="5" height="16" fill="#1f1f1f" rx="1"/><rect x="14" y="4" width="5" height="16" fill="#1f1f1f" rx="1"/></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 3l14 9-14 9V3z" fill="#1f1f1f"/></svg>
              }
            </button>
            <span style={{ marginLeft: 'auto', font: '500 12px/1 var(--font-display)', color: 'rgba(255,255,255,.6)' }}>
              Можно {MAX_PLAYS} прослушивания
            </span>
          </div>
        </div>
        <div>
          <label className="kp-eyebrow">ВАШ ВАРИАНТ</label>
          <div style={{ position: 'relative', marginTop: 6 }}>
            <input className="kp-input" value={text} onChange={e => setText(e.target.value)}
              placeholder="Напишите что слышите…"
              style={{ paddingRight: 60, fontFamily: 'var(--font-mono)', fontSize: 15 }} />
            <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', font: '500 11px/1 var(--font-display)', color: 'var(--c-ink-400)' }} className="kp-num">
              {text.length} / 80
            </div>
          </div>
          <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center', font: '500 11px/1.3 var(--font-display)', color: 'var(--c-ink-500)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/><path d="M12 8v5M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            Допустимо до 2 опечаток. Запятые и регистр не важны.
          </div>
        </div>
      </div>
      <SubmitBar label="Отправить ответ" disabled={disabled || !text.trim()} onSubmit={() => onAnswer({ text })} />
    </>
  )
}

const WAVE_BARS = Array.from({ length: 48 }, (_, i) => {
  const x = i / 48
  const env = Math.sin(x * Math.PI)
  const noise = ((Math.sin(i * 17.3) + 1) / 2) * .65 + .35
  return Math.max(0.08, env * noise)
})

function WaveformViz({ playing }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 48 }}>
      {WAVE_BARS.map((b, i) => (
        <div key={i} style={{
          width: 3,
          height: `${b * 100}%`,
          borderRadius: 2,
          background: i < WAVE_BARS.length * 0.5 ? 'var(--c-orange)' : 'rgba(255,255,255,.25)',
          transformOrigin: 'center',
          animation: playing ? `waveBar ${0.35 + (i % 6) * 0.07}s ease-in-out ${(i % 9) * 0.04}s infinite` : 'none',
        }} />
      ))}
    </div>
  )
}

// ===== imageCode =====
export function ImageCodeQuestion({ question, onAnswer, disabled }) {
  const { publicView } = question
  const [text, setText] = useState('')
  return (
    <>
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ position: 'relative', height: 130, borderRadius: 10, background: 'linear-gradient(135deg,#f7d9b3 0%,#e7a87a 100%)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src={publicView.assetUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', position: 'absolute', inset: 0 }}
            onError={e => { e.target.style.display='none' }} />
        </div>
        <div>
          <label className="kp-eyebrow">КОД</label>
          <input className="kp-input" value={text} onChange={e => setText(e.target.value)}
            placeholder="Введите код"
            autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false}
            style={{ marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: 17, height: 54, letterSpacing: '.05em' }}
            maxLength={40} />
        </div>
      </div>
      <SubmitBar disabled={disabled || !text.trim()} onSubmit={() => onAnswer({ text })} />
    </>
  )
}

// ===== shared submit bar =====
function SubmitBar({ disabled, label = 'Подтвердить', meta, onSubmit }) {
  return (
    <div style={{ padding: '12px 16px 22px', background: 'linear-gradient(to top, #fff 70%, rgba(255,255,255,0))' }}>
      {meta && <div style={{ font: '500 12px/1.2 var(--font-display)', color: 'var(--c-ink-500)', marginBottom: 8, textAlign: 'center' }}>{meta}</div>}
      <button className="kp-btn kp-btn--primary" style={{ width: '100%', height: 52 }} disabled={disabled} onClick={onSubmit}>
        {label}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
    </div>
  )
}

const PALETTES = [
  ['#3a2a23','#7c4f33'],['#4a3b2a','#a37147'],['#2c3a2d','#5a7350'],
  ['#3b3247','#7a5e8c'],['#42332a','#b46e3a'],['#2a2f3a','#4f5e7a'],
  ['#3a2823','#8c4a3a'],['#383224','#7a6532'],['#2e2a3a','#5b4d75'],['#1e2a2a','#3d6360'],
]
