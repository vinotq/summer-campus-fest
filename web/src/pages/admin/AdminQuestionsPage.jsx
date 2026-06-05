import { useEffect, useState, useRef, useCallback } from 'react'
import { api } from '../../utils/api.js'
import { useAdminStore } from '../../stores/adminStore.js'
import { CropModal } from '../../components/CropModal.jsx'
import { useMobile } from '../../utils/useMobile.js'

const TYPE_META = {
  grid3x3:   { label: '3×3 фото', color: 'var(--c-purple)',     bg: 'var(--c-purple-100)' },
  tiles:     { label: 'Клетки',   color: 'var(--c-orange-700)', bg: 'var(--c-orange-100)' },
  slider:    { label: 'Слайдер',  color: '#1f1f1f',             bg: '#ebe8e2' },
  audio:     { label: 'Аудио',    color: '#2f8a4d',             bg: '#e7f4ec' },
  imageCode: { label: 'Код',      color: '#7a3a14',             bg: '#f6e0cc' },
}

const DEFAULT_PAYLOADS = {
  grid3x3:   { tiles: Array(9).fill(null).map(() => ({ assetUrl: '', correct: false })) },
  tiles:     { assetUrl: '', grid: { cols: 4, rows: 4 }, correctCells: [] },
  slider:    { backgroundUrl: '', objectUrl: '', target: { x: 0.5, y: 0.5 }, tolerance: 0.06, axis: 'x' },
  audio:     { audioUrl: '', expected: '', alternatives: [], matching: { caseSensitive: false, maxDistance: 0 } },
  imageCode: { assetUrl: '', expected: '', matching: { caseSensitive: false, maxDistance: 0 } },
}

function fmtMs(ms) {
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return `${m}:${String(s).padStart(2,'0')}`
}

// ── Upload button with optional crop ──────────────────────────────────────
// aspect: undefined = без кропа (аудио), 1 = квадрат, 16/9 = широкий, null = свободный кроп
function UploadBtn({ label, accept, onUploaded, preview, aspect }) {
  const [uploading, setUploading] = useState(false)
  const [cropSrc, setCropSrc] = useState(null)     // data URL для модала
  const [cropFileName, setCropFileName] = useState('')
  const ref = useRef()
  const isAudio = accept?.includes('audio')

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    // Аудио — без кропа, сразу загружаем
    if (isAudio || aspect === undefined) {
      uploadFile(file)
      return
    }

    // Изображение — показываем кроп
    const reader = new FileReader()
    reader.onload = () => { setCropSrc(reader.result); setCropFileName(file.name) }
    reader.readAsDataURL(file)
  }

  async function uploadFile(file) {
    setUploading(true)
    try {
      const res = await api.uploadFile(file)
      onUploaded(res.url)
    } catch (err) {
      alert('Ошибка загрузки: ' + err.message)
    }
    setUploading(false)
  }

  function handleCropConfirm(croppedFile) {
    setCropSrc(null)
    uploadFile(croppedFile)
  }

  return (
    <>
      {cropSrc && (
        <CropModal
          src={cropSrc}
          fileName={cropFileName}
          aspect={aspect ?? undefined}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropSrc(null)}
        />
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {preview && (
          isAudio
            ? <audio src={preview} controls style={{ height: 32 }} />
            : <img src={preview} alt="" style={{ height: 56, width: 56, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--c-line)' }} />
        )}
        <input ref={ref} type="file" accept={accept} style={{ display: 'none' }} onChange={handleFile} />
        <button type="button" className="kp-btn kp-btn--ghost" style={{ height: 34, fontSize: 12 }}
          onClick={() => ref.current?.click()} disabled={uploading}>
          {uploading ? 'Загрузка…' : (preview ? '↑ Заменить' : `↑ ${label}`)}
        </button>
        {preview && !isAudio && (
          <span style={{ font: '500 11px/1 var(--font-mono)', color: 'var(--c-ink-400)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {preview}
          </span>
        )}
      </div>
    </>
  )
}

// ── Field wrapper ──────────────────────────────────────────────────────────
function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <label style={{ font: '600 12px/1 var(--font-display)', color: 'var(--c-ink-700)' }}>{label}</label>
        {hint && <span style={{ font: '500 10.5px/1 var(--font-display)', color: 'var(--c-ink-400)' }}>{hint}</span>}
      </div>
      {children}
    </div>
  )
}

// ── Payload editors ────────────────────────────────────────────────────────

function Grid3x3Editor({ payload, onChange }) {
  const tiles = payload.tiles || Array(9).fill(null).map(() => ({ assetUrl: '', correct: false }))
  const correctCount = tiles.filter(t => t.correct).length

  function setTile(i, patch) {
    const next = tiles.map((t, idx) => idx === i ? { ...t, ...patch } : t)
    onChange({ ...payload, tiles: next })
  }

  return (
    <div>
      <div style={{ marginBottom: 8, font: '500 12px/1 var(--font-display)', color: 'var(--c-ink-500)' }}>
        Правильных: <b style={{ color: correctCount > 0 ? 'var(--c-ok)' : 'var(--c-err)' }}>{correctCount}</b> / 9
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {tiles.map((tile, i) => (
          <div key={i} className="kp-card" style={{ padding: 8, border: tile.correct ? '2px solid var(--c-purple)' : undefined }}>
            <div style={{ aspectRatio: '1', background: 'var(--c-line-soft)', borderRadius: 6, overflow: 'hidden', marginBottom: 6, position: 'relative' }}>
              {tile.assetUrl
                ? <img src={tile.assetUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-ink-400)', font: '500 11px/1 var(--font-display)' }}>фото {i+1}</div>
              }
            </div>
            <UploadBtn label="Фото" accept="image/*" preview={null} aspect={1}
              onUploaded={url => setTile(i, { assetUrl: url })} />
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, cursor: 'pointer', font: '600 11px/1 var(--font-display)', color: tile.correct ? 'var(--c-purple)' : 'var(--c-ink-500)' }}>
              <input type="checkbox" checked={tile.correct} onChange={e => setTile(i, { correct: e.target.checked })} />
              Правильный
            </label>
          </div>
        ))}
      </div>
    </div>
  )
}

function TilesEditor({ payload, onChange }) {
  const { assetUrl = '', grid = { cols: 4, rows: 4 }, correctCells = [] } = payload
  const cols = grid.cols || 4
  const rows = grid.rows || 4
  const total = cols * rows
  const selected = new Set(correctCells)

  function toggleCell(i) {
    const next = new Set(selected)
    next.has(i) ? next.delete(i) : next.add(i)
    onChange({ ...payload, correctCells: [...next] })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Field label="Фоновое фото">
        <UploadBtn label="Загрузить фото" accept="image/*" preview={assetUrl || null} aspect={null}
          onUploaded={url => onChange({ ...payload, assetUrl: url })} />
      </Field>
      <div style={{ display: 'flex', gap: 16 }}>
        <Field label="Колонки (2–6)">
          <input type="number" min={2} max={6} className="kp-input" style={{ height: 36, width: 80 }}
            value={cols} onChange={e => onChange({ ...payload, grid: { cols: +e.target.value, rows }, correctCells: [] })} />
        </Field>
        <Field label="Строки (2–6)">
          <input type="number" min={2} max={6} className="kp-input" style={{ height: 36, width: 80 }}
            value={rows} onChange={e => onChange({ ...payload, grid: { cols, rows: +e.target.value }, correctCells: [] })} />
        </Field>
      </div>
      <Field label={`Правильные клетки (отмечено: ${selected.size})`} hint="Кликните по клетке">
        <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', background: 'var(--c-line-soft)', maxWidth: 360 }}>
          {assetUrl
            ? <img src={assetUrl} alt="" style={{ width: '100%', height: 'auto', display: 'block' }} />
            : <div style={{ aspectRatio: `${cols}/${rows}` }} />
          }
          <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}>
            {Array.from({ length: total }, (_, i) => (
              <div key={i} onClick={() => toggleCell(i)} style={{
                borderRight: i % cols < cols - 1 ? '1px solid rgba(255,255,255,.4)' : 'none',
                borderBottom: i < total - cols ? '1px solid rgba(255,255,255,.4)' : 'none',
                background: selected.has(i) ? 'rgba(129,67,135,.55)' : 'rgba(0,0,0,.1)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                font: '700 10px/1 var(--font-mono)', color: '#fff',
              }}>
                {selected.has(i) && '✓'}
              </div>
            ))}
          </div>
        </div>
      </Field>
    </div>
  )
}

function SliderEditor({ payload, onChange }) {
  const { backgroundUrl = '', objectUrl = '', target = { x: 0.5, y: 0.5 }, tolerance = 0.06, objectWidth = 56, objectHeight = 56 } = payload
  const imgRef = useRef()

  // Клик по фото — ставит цель в любое место (x + y)
  function handleImageClick(e) {
    const rect = imgRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100) / 100
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100) / 100
    onChange({ ...payload, target: { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) }, axis: 'x' })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Field label="Фоновое фото (с дыркой)">
          <UploadBtn label="Загрузить фон" accept="image/*" preview={backgroundUrl || null} aspect={null}
            onUploaded={url => onChange({ ...payload, backgroundUrl: url, axis: 'x' })} />
        </Field>
        <Field label="Кусочек пазла">
          <UploadBtn label="Загрузить кусочек" accept="image/*" preview={objectUrl || null} aspect={null}
            onUploaded={url => onChange({ ...payload, objectUrl: url, axis: 'x' })} />
        </Field>
      </div>

      <Field label="Правильная позиция — кликните по фото" hint={`x=${target.x.toFixed(2)}, y=${target.y.toFixed(2)}`}>
        <div ref={imgRef} onClick={handleImageClick}
          style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', background: '#e0dbd4', maxWidth: 520, cursor: 'crosshair', minHeight: backgroundUrl ? undefined : 80 }}>
          {backgroundUrl
            ? <img src={backgroundUrl} alt="" style={{ width: '100%', height: 'auto', display: 'block', pointerEvents: 'none' }} />
            : <div style={{ padding: '24px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-ink-400)', font: '500 12px/1 var(--font-display)' }}>Загрузите фон, затем кликните для установки цели</div>
          }

          {/* кусочек на целевой позиции — размер из objectWidth/objectHeight */}
          <div style={{ position: 'absolute', top: `${target.y * 100}%`, left: `${target.x * 100}%`, transform: 'translate(-50%,-50%)', pointerEvents: 'none', filter: 'drop-shadow(0 3px 8px rgba(0,0,0,.4))' }}>
            {objectUrl
              ? <img src={objectUrl} alt="" style={{ width: objectWidth, height: objectHeight, objectFit: 'contain' }} />
              : <div style={{ width: objectWidth, height: objectHeight, borderRadius: 8, background: 'var(--grad)', opacity: .9 }} />
            }
          </div>

          {/* tolerance зона — горизонтальная полоса */}
          <div style={{
            position: 'absolute',
            top: `${target.y * 100}%`, left: `${target.x * 100}%`,
            transform: 'translate(-50%, -50%)',
            width: `${tolerance * 2 * 100}%`,
            height: 52,
            border: '1.5px dashed rgba(231,123,46,.8)',
            borderRadius: 6,
            background: 'rgba(231,123,46,.1)',
            pointerEvents: 'none',
          }} />

          {/* координаты */}
          <div style={{ position: 'absolute', right: 8, bottom: 8, background: 'rgba(0,0,0,.6)', color: '#fff', font: '600 10px/1 var(--font-mono)', padding: '4px 7px', borderRadius: 4, pointerEvents: 'none' }}>
            x={target.x.toFixed(2)} y={target.y.toFixed(2)}
          </div>
          <div style={{ position: 'absolute', left: 8, top: 8, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)', color: '#fff', font: '500 10px/1 var(--font-display)', padding: '4px 8px', borderRadius: 4, pointerEvents: 'none' }}>
            ✦ Кликните для установки цели
          </div>
        </div>

        <div style={{ marginTop: 8, font: '500 11px/1.4 var(--font-display)', color: 'var(--c-ink-500)' }}>
          Игрок двигает кусочек только горизонтально. Кусочек будет появляться на той же высоте, что вы задали.
        </div>
      </Field>

      <Field label="Допуск (tolerance)" hint="Ширина зоны попадания по оси X · 0.01–0.3">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input type="range" min={0.01} max={0.3} step={0.01} value={tolerance}
            onChange={e => onChange({ ...payload, tolerance: +e.target.value, axis: 'x' })}
            style={{ flex: 1 }} />
          <div className="kp-num" style={{ font: '700 14px/1 var(--font-mono)', minWidth: 36 }}>{tolerance.toFixed(2)}</div>
        </div>
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Ширина объекта (px)" hint="отображается у игрока">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="range" min={24} max={160} step={4} value={objectWidth}
              onChange={e => onChange({ ...payload, objectWidth: +e.target.value })}
              style={{ flex: 1 }} />
            <div className="kp-num" style={{ font: '700 13px/1 var(--font-mono)', minWidth: 36 }}>{objectWidth}</div>
          </div>
        </Field>
        <Field label="Высота объекта (px)" hint="отображается у игрока">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="range" min={24} max={160} step={4} value={objectHeight}
              onChange={e => onChange({ ...payload, objectHeight: +e.target.value })}
              style={{ flex: 1 }} />
            <div className="kp-num" style={{ font: '700 13px/1 var(--font-mono)', minWidth: 36 }}>{objectHeight}</div>
          </div>
        </Field>
      </div>

      {/* мини-превью объекта с текущим размером */}
      {objectUrl && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src={objectUrl} alt="" style={{ width: objectWidth, height: objectHeight, objectFit: 'contain', border: '1px dashed var(--c-line)', borderRadius: 6, background: 'var(--c-line-soft)' }} />
          <span style={{ font: '500 11px/1.4 var(--font-display)', color: 'var(--c-ink-500)' }}>
            Превью объекта в масштабе {objectWidth}×{objectHeight}px
          </span>
        </div>
      )}
    </div>
  )
}

function AudioEditor({ payload, onChange }) {
  const { audioUrl = '', expected = '', alternatives = [], matching = { caseSensitive: false, maxDistance: 0 } } = payload

  function setAlt(i, val) {
    const next = [...alternatives]
    next[i] = val
    onChange({ ...payload, alternatives: next })
  }
  function addAlt() { onChange({ ...payload, alternatives: [...alternatives, ''] }) }
  function removeAlt(i) { onChange({ ...payload, alternatives: alternatives.filter((_, idx) => idx !== i) }) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Field label="Аудиофайл">
        <UploadBtn label="Загрузить аудио" accept="audio/*" preview={audioUrl || null}
          onUploaded={url => onChange({ ...payload, audioUrl: url })} />
      </Field>
      <Field label="Основной правильный ответ">
        <input className="kp-input" value={expected} placeholder="внимание эвакуация"
          onChange={e => onChange({ ...payload, expected: e.target.value })} />
      </Field>
      <Field label={`Альтернативные ответы (${alternatives.length})`} hint="любой из них засчитывается">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {alternatives.map((alt, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input className="kp-input" value={alt} placeholder={`вариант ${i + 1}`}
                onChange={e => setAlt(i, e.target.value)}
                style={{ flex: 1 }} />
              <button type="button" onClick={() => removeAlt(i)}
                style={{ height: 36, width: 36, border: '1px solid var(--c-line)', borderRadius: 6, background: 'transparent', color: 'var(--c-err)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                ×
              </button>
            </div>
          ))}
          <button type="button" className="kp-btn kp-btn--ghost" style={{ height: 32, fontSize: 12, alignSelf: 'flex-start' }}
            onClick={addAlt}>
            + Добавить вариант
          </button>
        </div>
      </Field>
      <Field label="Макс. ошибок" hint="0 = точное совпадение">
        <input type="number" min={0} max={10} className="kp-input" style={{ height: 36, width: 80 }}
          value={matching.maxDistance}
          onChange={e => onChange({ ...payload, matching: { ...matching, maxDistance: +e.target.value } })} />
      </Field>
    </div>
  )
}

function ImageCodeEditor({ payload, onChange }) {
  const { assetUrl = '', expected = '', matching = { caseSensitive: false, maxDistance: 0 } } = payload

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Field label="Картинка с кодом">
        <UploadBtn label="Загрузить картинку" accept="image/*" preview={assetUrl || null} aspect={null}
          onUploaded={url => onChange({ ...payload, assetUrl: url })} />
      </Field>
      <Field label="Правильный код">
        <input className="kp-input" value={expected} placeholder="K7Q9"
          style={{ fontFamily: 'var(--font-mono)', letterSpacing: '.2em', textTransform: 'uppercase' }}
          onChange={e => onChange({ ...payload, expected: e.target.value })} />
      </Field>
      <Field label="Макс. ошибок" hint="0 = точное совпадение">
        <input type="number" min={0} max={5} className="kp-input" style={{ height: 36, width: 80 }}
          value={matching.maxDistance}
          onChange={e => onChange({ ...payload, matching: { ...matching, maxDistance: +e.target.value } })} />
      </Field>
    </div>
  )
}

// ── New question modal ─────────────────────────────────────────────────────
function NewQuestionModal({ onClose, onCreated }) {
  const isMobile = useMobile()
  const [type, setType] = useState('grid3x3')
  const [title, setTitle] = useState('')
  const [baseScore, setBaseScore] = useState(100)
  const [timeLimitMs, setTimeLimitMs] = useState(30000)
  const [answerDelayMs, setAnswerDelayMs] = useState(0)
  const [payload, setPayload] = useState(DEFAULT_PAYLOADS.grid3x3)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function handleTypeChange(t) {
    setType(t)
    setPayload(structuredClone(DEFAULT_PAYLOADS[t]))
  }

  async function handleCreate() {
    if (!title.trim()) { setError('Введите заголовок вопроса'); return }
    setSaving(true); setError('')
    try {
      const res = await api.createQuestion({ type, title: title.trim(), baseScore, timeLimitMs, answerDelayMs, active: true, payload })
      onCreated(res.question)
    } catch (e) { setError(e.message) }
    setSaving(false)
  }

  const dialogStyle = isMobile
    ? { position: 'fixed', inset: 0, background: '#fff', zIndex: 100, display: 'flex', flexDirection: 'column', overflow: 'hidden' }
    : { width: 720, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }

  const inner = (
    <div className={isMobile ? undefined : 'kp-card'} style={dialogStyle}>
      <div style={{ padding: isMobile ? '14px 16px' : '20px 24px 16px', borderBottom: '1px solid var(--c-line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0, font: '700 18px/1 var(--font-display)' }}>Новый вопрос</h2>
        <button onClick={onClose} style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--c-ink-400)', font: '600 20px/1', lineHeight: 1 }}>×</button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: isMobile ? '16px' : '20px 24px' }}>
        <Field label="Тип капчи">
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {Object.entries(TYPE_META).map(([t, m]) => (
              <button key={t} type="button" onClick={() => handleTypeChange(t)}
                style={{ height: 28, padding: '0 12px', border: '1px solid var(--c-line)', borderRadius: 6, background: type === t ? m.bg : 'transparent', color: type === t ? m.color : 'var(--c-ink-500)', font: '600 12px/1 var(--font-display)', cursor: 'pointer', borderColor: type === t ? m.color : 'var(--c-line)' }}>
                {m.label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Заголовок вопроса для игрока">
          <input className="kp-input" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Выберите просроченные продукты" />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr', gap: 12 }}>
          <Field label="Базовые очки">
            <input type="number" className="kp-input" style={{ height: 36 }} value={baseScore}
              onChange={e => setBaseScore(+e.target.value)} />
          </Field>
          <Field label="Лимит (сек)" hint="таймер">
            <input type="number" className="kp-input" style={{ height: 36 }} value={timeLimitMs / 1000}
              onChange={e => setTimeLimitMs(+e.target.value * 1000)} />
          </Field>
          <Field label="Задержка (сек)" hint="кнопка ждёт">
            <input type="number" min={0} max={30} className="kp-input" style={{ height: 36 }} value={answerDelayMs / 1000}
              onChange={e => setAnswerDelayMs(Math.round(+e.target.value * 1000))} />
          </Field>
        </div>
        <div style={{ borderTop: '1px solid var(--c-line-soft)', paddingTop: 16, marginTop: 4 }}>
          <div className="kp-eyebrow" style={{ marginBottom: 14 }}>Контент вопроса</div>
          <PayloadEditor type={type} payload={payload} onChange={setPayload} />
        </div>
        {error && <div style={{ marginTop: 12, color: 'var(--c-err)', font: '500 13px/1.3 var(--font-display)' }}>{error}</div>}
      </div>
      <div style={{ padding: isMobile ? '12px 16px' : '16px 24px', borderTop: '1px solid var(--c-line)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button className="kp-btn kp-btn--ghost" style={{ height: 40 }} onClick={onClose}>Отмена</button>
        <button className="kp-btn kp-btn--primary" style={{ height: 40 }} onClick={handleCreate} disabled={saving}>
          {saving ? 'Создание…' : 'Создать вопрос'}
        </button>
      </div>
    </div>
  )

  if (isMobile) return inner

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      {inner}
    </div>
  )
}

function PayloadEditor({ type, payload, onChange }) {
  if (type === 'grid3x3') return <Grid3x3Editor payload={payload} onChange={onChange} />
  if (type === 'tiles')   return <TilesEditor payload={payload} onChange={onChange} />
  if (type === 'slider')  return <SliderEditor payload={payload} onChange={onChange} />
  if (type === 'audio')   return <AudioEditor payload={payload} onChange={onChange} />
  if (type === 'imageCode') return <ImageCodeEditor payload={payload} onChange={onChange} />
  return null
}

// ── Main page ──────────────────────────────────────────────────────────────
function fmtElapsed(ms) {
  if (!ms) return '—'
  if (ms < 1000) return `${ms}мс`
  return `${(ms / 1000).toFixed(1)}с`
}

function QuestionStats({ questionId }) {
  const [stats, setStats] = useState(null)
  useEffect(() => {
    setStats(null)
    api.questionStats(questionId).then(setStats).catch(() => {})
  }, [questionId])

  if (!stats) return (
    <div className="kp-card" style={{ padding: '14px 18px', marginBottom: 20, color: 'var(--c-ink-400)', font: '500 12px/1 var(--font-display)' }}>
      Загрузка статистики…
    </div>
  )

  const cells = [
    { label: 'Ответов', value: stats.attempts },
    { label: 'Верно', value: `${stats.correctPct}%`, color: stats.correctPct >= 50 ? 'var(--c-ok)' : 'var(--c-err)' },
    { label: 'Среднее', value: fmtElapsed(stats.avgElapsedMs) },
    { label: 'Мин', value: fmtElapsed(stats.minElapsedMs) },
    { label: 'Макс', value: fmtElapsed(stats.maxElapsedMs) },
  ]

  return (
    <div className="kp-card" style={{ padding: '14px 18px', marginBottom: 20 }}>
      <div className="kp-eyebrow" style={{ marginBottom: 12 }}>Статистика ответов</div>
      {stats.attempts === 0 ? (
        <div style={{ font: '500 12px/1 var(--font-display)', color: 'var(--c-ink-400)' }}>Ещё никто не отвечал на этот вопрос</div>
      ) : (
        <div style={{ display: 'flex', gap: 0, flexWrap: 'wrap' }}>
          {cells.map((c, i) => (
            <div key={i} style={{ flex: '1 1 80px', padding: '6px 12px', borderRight: i < cells.length - 1 ? '1px solid var(--c-line-soft)' : 'none' }}>
              <div className="kp-num" style={{ font: '700 20px/1 var(--font-display)', color: c.color || 'var(--c-ink)' }}>{c.value}</div>
              <div style={{ marginTop: 4, font: '500 10.5px/1 var(--font-display)', color: 'var(--c-ink-400)' }}>{c.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AdminQuestionsPage() {
  const { questions, setQuestions } = useAdminStore()
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('all')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editData, setEditData] = useState(null)
  const [showNew, setShowNew] = useState(false)
  const isMobile = useMobile()

  useEffect(() => {
    api.questions().then(r => setQuestions(r.questions))
  }, [])

  function selectQ(q) {
    setSelected(q)
    setEditData({ title: q.title, baseScore: q.baseScore, timeLimitMs: q.timeLimitMs, answerDelayMs: q.answerDelayMs ?? 0, active: q.active, payload: structuredClone(q.payload) })
    setConfirmDelete(false)
  }

  async function toggleActive(q) {
    await api.setQuestionActive(q.id, !q.active)
    const updated = await api.questions()
    setQuestions(updated.questions)
    if (selected?.id === q.id) setSelected(updated.questions.find(x => x.id === q.id))
  }

  async function saveQuestion() {
    if (!selected || !editData) return
    setSaving(true)
    try {
      await api.updateQuestion(selected.id, editData)
      const updated = await api.questions()
      setQuestions(updated.questions)
      const fresh = updated.questions.find(q => q.id === selected.id)
      setSelected(fresh)
      setEditData({ title: fresh.title, baseScore: fresh.baseScore, timeLimitMs: fresh.timeLimitMs, answerDelayMs: fresh.answerDelayMs ?? 0, active: fresh.active, payload: structuredClone(fresh.payload) })
    } catch (e) { alert(e.message) }
    setSaving(false)
  }

  async function deleteQuestion() {
    if (!selected) return
    setDeleting(true)
    try {
      await api.deleteQuestion(selected.id)
      const updated = await api.questions()
      setQuestions(updated.questions)
      setSelected(null)
      setEditData(null)
      setConfirmDelete(false)
    } catch (e) { alert(e.message) }
    setDeleting(false)
  }

  function handleCreated(q) {
    api.questions().then(r => {
      setQuestions(r.questions)
      selectQ(r.questions.find(x => x.id === q.id) || q)
    })
    setShowNew(false)
  }

  const activeTime = questions.filter(q => q.active).reduce((a, q) => a + q.timeLimitMs, 0)
  const budgetMin = Math.floor(activeTime / 60000)
  const budgetSec = Math.floor((activeTime % 60000) / 1000)

  const FILTERS = [
    { id: 'all', label: 'Все', count: questions.length },
    { id: 'grid', label: '3×3', count: questions.filter(q=>q.type==='grid3x3').length },
    { id: 'tiles', label: 'Клетки', count: questions.filter(q=>q.type==='tiles').length },
    { id: 'slider', label: 'Слайдер', count: questions.filter(q=>q.type==='slider').length },
    { id: 'audio', label: 'Аудио', count: questions.filter(q=>q.type==='audio').length },
    { id: 'code', label: 'Код', count: questions.filter(q=>q.type==='imageCode').length },
  ]

  const filtered = questions.filter(q => {
    if (filter === 'all') return true
    if (filter === 'grid') return q.type === 'grid3x3'
    if (filter === 'tiles') return q.type === 'tiles'
    if (filter === 'slider') return q.type === 'slider'
    if (filter === 'audio') return q.type === 'audio'
    if (filter === 'code') return q.type === 'imageCode'
    return true
  })

  // На мобильном: если выбран вопрос — показываем редактор, иначе список
  const showMobileEditor = isMobile && selected && editData

  function QuestionList() {
    return (
      <div style={{ background: '#fff', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'auto' }}>
        <div style={{ display: 'flex', gap: 5, padding: '10px 12px', borderBottom: '1px solid var(--c-line-soft)', position: 'sticky', top: 0, background: '#fff', zIndex: 1, flexWrap: 'wrap' }}>
          {FILTERS.map(t => (
            <button key={t.id} onClick={() => setFilter(t.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 24, padding: '0 8px', background: filter === t.id ? 'var(--c-ink)' : 'transparent', color: filter === t.id ? '#fff' : 'var(--c-ink-500)', border: filter === t.id ? 'none' : '1px solid var(--c-line)', borderRadius: 5, font: '600 11px/1 var(--font-display)', cursor: 'pointer' }}>
              {t.label} <span style={{ opacity: .65, font: '600 10px/1 var(--font-mono)' }}>{t.count}</span>
            </button>
          ))}
        </div>
        {filtered.map(q => {
          const t = TYPE_META[q.type] || TYPE_META.grid3x3
          return (
            <div key={q.id} onClick={() => selectQ(q)} style={{ display: 'grid', gridTemplateColumns: '14px 1fr auto', gap: 8, alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid var(--c-line-soft)', background: selected?.id === q.id ? 'var(--c-purple-50)' : 'transparent', borderLeft: selected?.id === q.id ? '3px solid var(--c-purple)' : '3px solid transparent', cursor: 'pointer', opacity: q.active ? 1 : .5 }}>
              <svg width="8" height="12" viewBox="0 0 10 14" fill="none">
                {[3,7,11].map(y => <g key={y}><circle cx="2" cy={y-8} r="1.3" fill="var(--c-ink-300)"/><circle cx="8" cy={y-8} r="1.3" fill="var(--c-ink-300)"/></g>)}
              </svg>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                  <span style={{ height: 16, padding: '0 5px', background: t.bg, color: t.color, font: '600 9px/1 var(--font-display)', letterSpacing: '.04em', borderRadius: 3, display: 'inline-flex', alignItems: 'center', textTransform: 'uppercase', flexShrink: 0 }}>{t.label}</span>
                  <span className="kp-num" style={{ font: '500 10px/1 var(--font-mono)', color: 'var(--c-ink-400)' }}>#{String(q.id).padStart(2,'0')}</span>
                </div>
                <div style={{ font: '600 13px/1.2 var(--font-display)', color: 'var(--c-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{q.title}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 3, font: '500 10.5px/1 var(--font-display)', color: 'var(--c-ink-500)' }}>
                  <span className="kp-num">⏱ {fmtMs(q.timeLimitMs)}</span>
                  <span className="kp-num">★ {q.baseScore}</span>
                </div>
              </div>
              <div onClick={e => { e.stopPropagation(); toggleActive(q) }}
                style={{ width: 30, height: 17, borderRadius: 999, background: q.active ? 'var(--c-ink)' : 'var(--c-line)', position: 'relative', transition: 'background .15s', cursor: 'pointer', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: 2, left: q.active ? 14 : 2, width: 13, height: 13, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,.18)', transition: 'left .15s' }} />
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: 'var(--c-ink-400)', font: '500 13px/1.4 var(--font-display)' }}>Вопросов нет</div>}
      </div>
    )
  }

  function QuestionEditor({ compact }) {
    if (!selected || !editData) return null
    return (
      <div style={{ overflow: 'auto', padding: compact ? '16px 16px 40px' : '24px 32px 40px', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, font: '500 12px/1 var(--font-display)', color: 'var(--c-ink-500)', marginBottom: 8 }}>
          {compact && (
            <button onClick={() => { setSelected(null); setEditData(null) }}
              style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 0, cursor: 'pointer', color: 'var(--c-ink-500)', font: '500 12px/1 var(--font-display)', padding: '0 8px 0 0' }}>
              ← Назад
            </button>
          )}
          <span>{TYPE_META[selected.type]?.label}</span><span>·</span>
          <span className="kp-num">#{String(selected.id).padStart(2,'0')}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: compact ? 16 : 24 }}>
          <input value={editData.title} onChange={e => setEditData(d => ({...d, title: e.target.value}))}
            style={{ flex: 1, border: 0, outline: 'none', background: 'transparent', font: `700 ${compact ? 18 : 26}px/1.1 var(--font-display)`, letterSpacing: '-.025em', color: 'var(--c-ink)', padding: 0 }} />
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            {confirmDelete ? (
              <>
                <button className="kp-btn kp-btn--ghost" style={{ height: 34 }} onClick={() => setConfirmDelete(false)}>Отмена</button>
                <button style={{ height: 34, padding: '0 12px', border: 0, borderRadius: 999, background: 'var(--c-err)', color: '#fff', font: '600 12px/1 var(--font-display)', cursor: 'pointer' }}
                  onClick={deleteQuestion} disabled={deleting}>{deleting ? '…' : 'Удалить'}</button>
              </>
            ) : (
              <button title="Удалить вопрос"
                style={{ height: 34, width: 34, border: '1px solid var(--c-line)', borderRadius: 8, background: 'transparent', color: 'var(--c-err)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => setConfirmDelete(true)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
            <button className="kp-btn kp-btn--solid" style={{ height: 34 }} onClick={saveQuestion} disabled={saving}>
              {saving ? '…' : 'Сохранить'}
            </button>
          </div>
        </div>

        <div className="kp-card" style={{ padding: '14px 16px', marginBottom: 16, display: 'flex', gap: compact ? 12 : 24, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <Field label="Очки">
            <input type="number" className="kp-input" style={{ height: 36, width: compact ? 80 : 100 }}
              value={editData.baseScore} onChange={e => setEditData(d => ({...d, baseScore: +e.target.value}))} />
          </Field>
          <Field label="Лимит (сек)">
            <input type="number" className="kp-input" style={{ height: 36, width: compact ? 80 : 100 }}
              value={editData.timeLimitMs / 1000}
              onChange={e => setEditData(d => ({...d, timeLimitMs: +e.target.value * 1000}))} />
          </Field>
          <Field label="Задержка (сек)">
            <input type="number" min={0} max={30} className="kp-input" style={{ height: 36, width: compact ? 80 : 100 }}
              value={(editData.answerDelayMs ?? 0) / 1000}
              onChange={e => setEditData(d => ({...d, answerDelayMs: Math.round(+e.target.value * 1000)}))} />
          </Field>
          <Field label="Активен">
            <div onClick={() => setEditData(d => ({...d, active: !d.active}))}
              style={{ width: 40, height: 22, borderRadius: 999, background: editData.active ? 'var(--c-ink)' : 'var(--c-line)', position: 'relative', cursor: 'pointer', marginTop: 4 }}>
              <div style={{ position: 'absolute', top: 2, left: editData.active ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .15s' }} />
            </div>
          </Field>
        </div>

        <QuestionStats questionId={selected.id} />

        <div className="kp-card" style={{ padding: '16px' }}>
          <div className="kp-eyebrow" style={{ marginBottom: 16 }}>Контент вопроса</div>
          <PayloadEditor
            type={selected.type}
            payload={editData.payload}
            onChange={p => setEditData(d => ({...d, payload: p}))}
          />
        </div>
      </div>
    )
  }

  if (isMobile) {
    return (
      <>
        {showNew && <NewQuestionModal onClose={() => setShowNew(false)} onCreated={handleCreated} />}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--c-line)', background: '#fff' }}>
          <h1 style={{ margin: 0, font: '700 18px/1.1 var(--font-display)', letterSpacing: '-.02em' }}>Вопросы</h1>
          <button className="kp-btn kp-btn--primary" style={{ height: 34, fontSize: 12 }} onClick={() => setShowNew(true)}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2.4" strokeLinecap="round"/></svg>
            Новый
          </button>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {showMobileEditor
            ? <QuestionEditor compact />
            : <QuestionList />
          }
        </div>
      </>
    )
  }

  return (
    <>
      {showNew && <NewQuestionModal onClose={() => setShowNew(false)} onCreated={handleCreated} />}

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '18px 24px 14px', borderBottom: '1px solid var(--c-line)', background: '#fff' }}>
        <h1 style={{ margin: 0, font: '700 22px/1.1 var(--font-display)', letterSpacing: '-.02em' }}>Вопросы</h1>
        <button className="kp-btn kp-btn--primary" style={{ height: 36 }} onClick={() => setShowNew(true)}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2.4" strokeLinecap="round"/></svg>
          Новый вопрос
        </button>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '340px 1fr', overflow: 'hidden', background: '#f6f4f0' }}>
        <div style={{ borderRight: '1px solid var(--c-line)', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          <QuestionList />
        </div>

        {selected && editData ? (
          <QuestionEditor />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--c-ink-400)', font: '500 14px/1.4 var(--font-display)' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none"><path d="M9 11h6M9 15h4M5 21l-1-3V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6l-1 1z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Выберите вопрос слева или создайте новый
          </div>
        )}
      </div>
    </>
  )
}
