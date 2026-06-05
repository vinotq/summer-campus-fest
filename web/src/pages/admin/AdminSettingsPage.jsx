import { useEffect, useState } from 'react'
import { api } from '../../utils/api.js'
import { useMobile } from '../../utils/useMobile.js'

const TYPE_LABELS = {
  grid3x3:   { label: '3×3 фото',  color: 'var(--c-purple)',     bg: 'var(--c-purple-100)' },
  tiles:     { label: 'Клетки',    color: 'var(--c-orange-700)', bg: 'var(--c-orange-100)' },
  slider:    { label: 'Слайдер',   color: '#1f1f1f',             bg: '#ebe8e2' },
  audio:     { label: 'Аудио',     color: '#2f8a4d',             bg: '#e7f4ec' },
  imageCode: { label: 'Код',       color: '#7a3a14',             bg: '#f6e0cc' },
}
const TYPES = Object.keys(TYPE_LABELS)

export default function AdminSettingsPage() {
  const isMobile = useMobile()
  const [counts, setCounts] = useState({ grid3x3: 3, tiles: 1, slider: 2, audio: 2, imageCode: 1 })
  const [required, setRequired] = useState([])
  const [allQuestions, setAllQuestions] = useState([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    Promise.all([api.getQuizSettings(), api.questions()]).then(([settings, qRes]) => {
      setCounts(settings.counts ?? {})
      setRequired(settings.required ?? [])
      setAllQuestions(qRes.questions)
    })
  }, [])

  const total = TYPES.reduce((s, t) => s + (counts[t] ?? 0), 0) + required.length
  const budgetMs = allQuestions
    .filter(q => q.active)
    .filter(q => {
      const inRequired = required.includes(q.id)
      return inRequired || (counts[q.type] ?? 0) > 0
    })
    .reduce((sum, q) => sum + q.timeLimitMs, 0)
  const budgetMin = Math.floor(budgetMs / 60000)
  const budgetSec = Math.floor((budgetMs % 60000) / 1000)

  async function save() {
    setSaving(true); setSaved(false)
    await api.setQuizSettings({ counts, required })
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function toggleRequired(id) {
    setRequired(r => r.includes(id) ? r.filter(x => x !== id) : [...r, id])
  }

  function moveRequired(id, dir) {
    setRequired(r => {
      const i = r.indexOf(id)
      if (i < 0) return r
      const n = [...r]
      const j = i + dir
      if (j < 0 || j >= n.length) return r
      ;[n[i], n[j]] = [n[j], n[i]]
      return n
    })
  }

  const requiredQuestions = required.map(id => allQuestions.find(q => q.id === id)).filter(Boolean)
  const availableForRequired = allQuestions.filter(q => !required.includes(q.id))

  return (
    <>
      <div style={{ padding: isMobile ? '12px 16px' : '18px 24px 14px', borderBottom: '1px solid var(--c-line)', background: '#fff', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, font: `700 ${isMobile ? 17 : 22}px/1.1 var(--font-display)`, letterSpacing: '-.02em' }}>{isMobile ? 'Настройки квиза' : 'Правила формирования квиза'}</h1>
          <div style={{ marginTop: 4, font: '500 12px/1 var(--font-display)', color: 'var(--c-ink-500)' }}>
            <b style={{ color: 'var(--c-ink)' }}>{total}</b> вопр. · <b className="kp-num" style={{ color: 'var(--c-ink)' }}>{budgetMin}:{String(budgetSec).padStart(2,'0')}</b>
          </div>
        </div>
        <button className="kp-btn kp-btn--primary" style={{ height: 36, flexShrink: 0 }} onClick={save} disabled={saving}>
          {saved ? '✓ Сохранено' : saving ? '…' : 'Сохранить'}
        </button>
      </div>

      <div style={{ overflow: 'auto', padding: isMobile ? '16px' : '28px 32px', display: 'flex', flexDirection: 'column', gap: isMobile ? 16 : 28 }}>

        {/* Рандомные вопросы по типам */}
        <div className="kp-card" style={{ padding: 24 }}>
          <div style={{ marginBottom: 18 }}>
            <div style={{ font: '700 15px/1 var(--font-display)' }}>Случайные вопросы по категориям</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {TYPES.map(type => {
              const meta = TYPE_LABELS[type]
              const available = allQuestions.filter(q => q.type === type && q.active).length
              const val = counts[type] ?? 0
              return (
                <div key={type} style={{ padding: '14px 16px', border: '1.5px solid var(--c-line)', borderRadius: 12, background: val > 0 ? meta.bg : '#fafaf8' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ height: 20, padding: '0 8px', background: meta.bg, color: meta.color, font: '600 11px/1 var(--font-display)', letterSpacing: '.04em', borderRadius: 5, display: 'inline-flex', alignItems: 'center', textTransform: 'uppercase', border: `1px solid ${meta.color}22` }}>
                      {meta.label}
                    </span>
                    <span style={{ font: '500 11px/1 var(--font-display)', color: 'var(--c-ink-400)' }}>доступно: {available}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={() => setCounts(c => ({...c, [type]: Math.max(0, (c[type] ?? 0) - 1)}))}
                      style={{ width: 32, height: 32, border: '1.5px solid var(--c-line)', borderRadius: 8, background: '#fff', font: '700 18px/1', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-ink-500)' }}>−</button>
                    <div className="kp-num" style={{ flex: 1, textAlign: 'center', font: '800 28px/1 var(--font-display)', color: val > 0 ? meta.color : 'var(--c-ink-300)' }}>{val}</div>
                    <button onClick={() => setCounts(c => ({...c, [type]: Math.min(available, (c[type] ?? 0) + 1)}))}
                      style={{ width: 32, height: 32, border: '1.5px solid var(--c-line)', borderRadius: 8, background: '#fff', font: '700 18px/1', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-ink-500)' }}>+</button>
                  </div>
                  {val > available && (
                    <div style={{ marginTop: 6, font: '500 10.5px/1.3 var(--font-display)', color: 'var(--c-warn)' }}>
                      Недостаточно активных вопросов
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Обязательные вопросы */}
        <div className="kp-card" style={{ padding: 24 }}>
          <div style={{ marginBottom: 18 }}>
            <div style={{ font: '700 15px/1 var(--font-display)' }}>Обязательные вопросы</div>
          </div>

          {/* Список выбранных */}
          {requiredQuestions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
              {requiredQuestions.map((q, i) => {
                const meta = TYPE_LABELS[q.type]
                return (
                  <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--c-line-soft)', borderRadius: 10, border: '1px solid var(--c-line)' }}>
                    <span style={{ font: '700 13px/1 var(--font-mono)', color: 'var(--c-ink-400)', minWidth: 20 }}>{i + 1}</span>
                    <span style={{ height: 18, padding: '0 6px', background: meta.bg, color: meta.color, font: '600 9px/1 var(--font-display)', borderRadius: 4, display: 'inline-flex', alignItems: 'center', textTransform: 'uppercase' }}>{meta.label}</span>
                    <span style={{ flex: 1, font: '600 13px/1.2 var(--font-display)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{q.title}</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => moveRequired(q.id, -1)} disabled={i === 0}
                        style={iconBtn}>↑</button>
                      <button onClick={() => moveRequired(q.id, 1)} disabled={i === requiredQuestions.length - 1}
                        style={iconBtn}>↓</button>
                      <button onClick={() => toggleRequired(q.id)} style={{ ...iconBtn, color: 'var(--c-err)' }}>✕</button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ padding: '16px 0', font: '500 13px/1.4 var(--font-display)', color: 'var(--c-ink-400)', marginBottom: 12 }}>
              Нет обязательных вопросов — добавьте из списка ниже
            </div>
          )}

          {/* Добавить вопрос */}
          {availableForRequired.length > 0 && (
            <div>
              <div style={{ font: '600 11px/1 var(--font-display)', color: 'var(--c-ink-500)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>Добавить</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 240, overflow: 'auto' }}>
                {availableForRequired.map(q => {
                  const meta = TYPE_LABELS[q.type]
                  return (
                    <button key={q.id} onClick={() => toggleRequired(q.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', border: '1px solid var(--c-line)', borderRadius: 8, background: '#fff', cursor: 'pointer', textAlign: 'left', opacity: q.active ? 1 : .55 }}>
                      <span style={{ height: 16, padding: '0 5px', background: meta.bg, color: meta.color, font: '600 9px/1 var(--font-display)', borderRadius: 3, display: 'inline-flex', alignItems: 'center', textTransform: 'uppercase', flexShrink: 0 }}>{meta.label}</span>
                      <span style={{ font: '500 12.5px/1 var(--font-display)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', flex: 1 }}>{q.title}</span>
                      <span style={{ font: '600 11px/1 var(--font-display)', color: 'var(--c-purple)', flexShrink: 0 }}>+ добавить</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

      </div>
    </>
  )
}

const iconBtn = {
  width: 26, height: 26, border: '1px solid var(--c-line)', borderRadius: 6,
  background: 'transparent', font: '600 12px/1', cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  color: 'var(--c-ink-500)',
}
