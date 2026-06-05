import { useEffect, useState, useCallback } from 'react'
import { useAdminStore } from '../../stores/adminStore.js'
import { api } from '../../utils/api.js'
import { useMobile } from '../../utils/useMobile.js'

const TYPE_COLORS = {
  grid3x3:   { label: '3×3',      color: '#814387', bg: '#f3eaf8' },
  tiles:     { label: 'Клетки',   color: '#b55a0e', bg: '#fdf0e6' },
  slider:    { label: 'Слайдер',  color: '#1f1f1f', bg: '#ebe8e2' },
  audio:     { label: 'Аудио',    color: '#2f8a4d', bg: '#e7f4ec' },
  imageCode: { label: 'Код',      color: '#7a3a14', bg: '#f6e0cc' },
}

function fmtTime(ms) {
  if (!ms) return '—'
  if (ms < 60000) return `${(ms/1000).toFixed(1)}с`
  return `${Math.floor(ms/60000)}м ${Math.floor((ms%60000)/1000)}с`
}

function PlayerResultModal({ session, onClose, onScoreChanged }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [edits, setEdits] = useState({}) // answerId -> { correct, score }
  const [saving, setSaving] = useState({}) // answerId -> bool
  const [saved, setSaved] = useState({}) // answerId -> bool

  useEffect(() => {
    setLoading(true)
    api.sessionResults(session.id).then(r => {
      setData(r)
      const initial = {}
      r.answers.forEach(a => { initial[a.id] = { correct: a.correct, score: a.score } })
      setEdits(initial)
      setLoading(false)
    })
  }, [session.id])

  async function saveAnswer(answerId) {
    const edit = edits[answerId]
    if (!edit) return
    setSaving(s => ({ ...s, [answerId]: true }))
    try {
      const res = await api.updateAnswer(answerId, edit)
      setData(d => ({ ...d, session: { ...d.session, totalScore: res.newTotal } }))
      onScoreChanged(session.id, res.newTotal)
      setSaved(s => ({ ...s, [answerId]: true }))
      setTimeout(() => setSaved(s => ({ ...s, [answerId]: false })), 1500)
    } catch (e) {
      alert('Ошибка: ' + e.message)
    }
    setSaving(s => ({ ...s, [answerId]: false }))
  }

  const isMobile = useMobile()

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 200, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: '#fff', borderRadius: isMobile ? '16px 16px 0 0' : 14, width: isMobile ? '100%' : 640, maxHeight: isMobile ? '92dvh' : '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,.25)' }}>

        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--c-line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ font: '700 17px/1 var(--font-display)' }}>{session.lastName} {session.firstName}</div>
            {data && (
              <div style={{ marginTop: 5, font: '500 12px/1 var(--font-display)', color: 'var(--c-ink-500)' }}>
                Итого: <b className="kp-num" style={{ color: 'var(--c-ink)', fontSize: 15 }}>{data.session.totalScore}</b> баллов
                {session.finishedAt ? '' : ' · ещё играет'}
              </div>
            )}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--c-ink-400)', font: '400 24px/1' }}>×</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', padding: '12px 20px 24px' }}>
          {loading && <div style={{ padding: 32, textAlign: 'center', color: 'var(--c-ink-400)', font: '500 13px/1 var(--font-display)' }}>Загрузка…</div>}
          {data && data.answers.length === 0 && (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--c-ink-400)', font: '500 13px/1 var(--font-display)' }}>Ответов пока нет</div>
          )}
          {data && data.answers.map((a, i) => {
            const edit = edits[a.id] ?? { correct: a.correct, score: a.score }
            const meta = TYPE_COLORS[a.questionType] ?? TYPE_COLORS.grid3x3
            const isDirty = edit.correct !== a.correct || edit.score !== a.score
            return (
              <div key={a.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--c-line-soft)', display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'start' }}>
                {/* Left: question info */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                    <span style={{ font: '700 12px/1 var(--font-mono)', color: 'var(--c-ink-400)', minWidth: 20 }}>{i + 1}</span>
                    <span style={{ height: 17, padding: '0 6px', background: meta.bg, color: meta.color, font: '600 9px/1 var(--font-display)', borderRadius: 4, display: 'inline-flex', alignItems: 'center', textTransform: 'uppercase' }}>{meta.label}</span>
                    <span style={{ font: '600 13px/1.2 var(--font-display)', color: 'var(--c-ink)' }}>{a.questionTitle}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, font: '500 11.5px/1 var(--font-display)', color: 'var(--c-ink-500)', paddingLeft: 26 }}>
                    <span className="kp-num">⏱ {fmtTime(a.elapsedMs)}</span>
                    <span>база: <b className="kp-num">{a.baseScore}</b></span>
                    {a.answerData?.text != null && (
                      <span style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        ответ: «{a.answerData.text}»
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: edit controls */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {/* Correct toggle */}
                    <button onClick={() => setEdits(e => ({ ...e, [a.id]: { ...edit, correct: !edit.correct } }))}
                      style={{ height: 26, padding: '0 10px', border: `1.5px solid ${edit.correct ? 'var(--c-ok)' : 'var(--c-err)'}`, borderRadius: 6, background: edit.correct ? 'rgba(47,138,77,.1)' : 'rgba(200,58,58,.07)', color: edit.correct ? 'var(--c-ok)' : 'var(--c-err)', font: '600 11px/1 var(--font-display)', cursor: 'pointer' }}>
                      {edit.correct ? '✓ верно' : '✗ неверно'}
                    </button>
                    {/* Score input */}
                    <input type="number" min={0} max={9999} value={edit.score}
                      onChange={e => setEdits(ed => ({ ...ed, [a.id]: { ...edit, score: Math.max(0, parseInt(e.target.value) || 0) } }))}
                      style={{ width: 64, height: 26, border: '1.5px solid var(--c-line)', borderRadius: 6, textAlign: 'center', font: '700 13px/1 var(--font-mono)', outline: 'none', padding: '0 4px' }} />
                    {/* Save button — only visible when dirty */}
                    {isDirty && (
                      <button onClick={() => saveAnswer(a.id)} disabled={saving[a.id]}
                        style={{ height: 26, padding: '0 10px', border: 0, borderRadius: 6, background: 'var(--c-purple)', color: '#fff', font: '600 11px/1 var(--font-display)', cursor: 'pointer' }}>
                        {saving[a.id] ? '…' : 'Сохранить'}
                      </button>
                    )}
                    {saved[a.id] && !isDirty && (
                      <span style={{ font: '600 11px/1 var(--font-display)', color: 'var(--c-ok)' }}>✓</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function AdminPlayersPage() {
  const { sessions, setSessions } = useAdminStore()
  const [search, setSearch] = useState('')
  const [clearing, setClearing] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [viewSession, setViewSession] = useState(null)
  const isMobile = useMobile()

  function handleScoreChanged(sessionId, newTotal) {
    setSessions(sessions.map(s => s.id === sessionId ? { ...s, totalScore: newTotal } : s))
  }

  useEffect(() => {
    api.sessions().then(r => setSessions(r.sessions))
  }, [])

  async function handleClear() {
    setClearing(true)
    await api.clearPlayers()
    setSessions([])
    setConfirmClear(false)
    setClearing(false)
  }

  async function toggleVisibility(session) {
    const hidden = !session.hiddenFromDashboard
    await api.setVisibility(session.id, hidden)
    useAdminStore.getState().setSessionVisibility(session.id, hidden)
  }

  // Group sessions by player name
  const playerGroups = (() => {
    const map = new Map()
    sessions.forEach(s => {
      if (search) {
        const q = search.toLowerCase()
        if (!(s.lastName + ' ' + s.firstName).toLowerCase().includes(q)) return
      }
      const key = `${s.lastName}__${s.firstName}`
      if (!map.has(key)) map.set(key, { lastName: s.lastName, firstName: s.firstName, sessions: [] })
      map.get(key).sessions.push(s)
    })
    return Array.from(map.values())
  })()

  const uniquePlayers = new Set(sessions.map(s => `${s.lastName}__${s.firstName}`)).size
  const live = sessions.filter(s => !s.finishedAt).length
  const finished = sessions.filter(s => s.finishedAt).length
  const scores = sessions.filter(s => s.finishedAt && !s.hiddenFromDashboard).map(s => s.totalScore)
  const bestScore = scores.length ? Math.max(...scores) : 0

  const stats = [
    { label: 'Игроков', value: uniquePlayers },
    { label: 'Попыток', value: sessions.length },
    { label: 'Играют', value: live, tone: 'live' },
    { label: 'Завершили', value: finished },
    { label: 'Лучший', value: bestScore, tone: 'orange' },
  ]

  return (
    <>
      {viewSession && (
        <PlayerResultModal
          session={viewSession}
          onClose={() => setViewSession(null)}
          onScoreChanged={handleScoreChanged}
        />
      )}

      {/* Header */}
      <div style={{ padding: isMobile ? '14px 16px' : '18px 24px 14px', borderBottom: '1px solid var(--c-line)', background: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isMobile ? 10 : 12 }}>
          <h1 style={{ margin: 0, font: `700 ${isMobile ? 18 : 22}px/1.1 var(--font-display)`, letterSpacing: '-.02em' }}>Игроки</h1>
          {confirmClear ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button className="kp-btn kp-btn--ghost" style={{ height: 32 }} onClick={() => setConfirmClear(false)}>Отмена</button>
              <button style={{ height: 32, padding: '0 12px', border: 0, borderRadius: 999, background: 'var(--c-err)', color: '#fff', font: '600 11px/1 var(--font-display)', cursor: 'pointer' }}
                onClick={handleClear} disabled={clearing}>{clearing ? 'Очистка…' : 'Да, удалить'}</button>
            </div>
          ) : (
            <button className="kp-btn kp-btn--ghost" style={{ height: 32, fontSize: 12, color: 'var(--c-err)' }} onClick={() => setConfirmClear(true)}>
              Очистить
            </button>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', height: 36, border: '1px solid var(--c-line)', borderRadius: 8, background: '#fff', font: '500 13px/1 var(--font-display)', color: 'var(--c-ink-500)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7"/><path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по имени…" style={{ border: 0, outline: 'none', font: 'inherit', color: 'inherit', background: 'transparent', width: '100%' }} />
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3,1fr)' : 'repeat(5,1fr)', gap: 1, background: 'var(--c-line)', borderBottom: '1px solid var(--c-line)' }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: '#fff', padding: isMobile ? '10px 12px' : '14px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
              {s.tone === 'live' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#c83a3a' }} />}
              <span className="kp-eyebrow" style={{ color: 'var(--c-ink-500)', fontSize: isMobile ? 9 : undefined }}>{s.label}</span>
            </div>
            <div className="kp-num" style={{ font: `700 ${isMobile ? 18 : 22}px/1 var(--font-display)`, letterSpacing: '-.02em', color: s.tone === 'orange' ? 'var(--c-orange)' : s.tone === 'live' ? 'var(--c-err)' : 'var(--c-ink)' }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Grouped list */}
      <div style={{ flex: 1, overflow: 'auto', background: '#f6f4f0' }}>
        {playerGroups.length === 0 && (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--c-ink-400)', font: '500 14px/1.4 var(--font-display)' }}>
            {search ? 'Ничего не найдено' : 'Игроков пока нет'}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 8 : 10, padding: isMobile ? '10px 12px' : '16px 20px' }}>
          {playerGroups.map(group => (
            <PlayerGroup
              key={`${group.lastName}__${group.firstName}`}
              group={group}
              onViewSession={setViewSession}
              onToggleVisibility={toggleVisibility}
              isMobile={isMobile}
            />
          ))}
        </div>
      </div>
    </>
  )
}

function PlayerGroup({ group, onViewSession, onToggleVisibility, isMobile }) {
  const [expanded, setExpanded] = useState(true)
  const { sessions } = group
  const bestScore = Math.max(...sessions.filter(s => s.finishedAt).map(s => s.totalScore), 0)
  const hasLive = sessions.some(s => !s.finishedAt)
  const allHidden = sessions.every(s => s.hiddenFromDashboard)

  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--c-line)', overflow: 'hidden' }}>
      {/* Player header row */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: isMobile ? '12px 14px' : '14px 18px', cursor: 'pointer', background: hasLive ? 'rgba(200,58,58,.04)' : '#fff', userSelect: 'none' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: hasLive ? 'var(--grad)' : 'var(--c-line-soft)', color: hasLive ? '#fff' : 'var(--c-ink-700)', font: '700 15px/1 var(--font-display)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {(group.lastName || '?')[0]}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ font: '700 15px/1.1 var(--font-display)', color: 'var(--c-ink)' }}>{group.lastName} {group.firstName}</div>
          <div style={{ marginTop: 4, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ font: '500 11px/1 var(--font-display)', color: 'var(--c-ink-400)' }}>
              {sessions.length} {sessions.length === 1 ? 'попытка' : sessions.length <= 4 ? 'попытки' : 'попыток'}
            </span>
            {hasLive && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, font: '600 10px/1 var(--font-display)', color: '#c83a3a' }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#c83a3a' }} />играет
              </span>
            )}
            {allHidden && <span style={{ font: '500 10px/1 var(--font-display)', color: 'var(--c-ink-400)' }}>скрыт</span>}
          </div>
        </div>
        {bestScore > 0 && (
          <div className="kp-num" style={{ font: '800 22px/1 var(--font-display)', color: 'var(--c-ink)', letterSpacing: '-.03em' }}>
            {bestScore}
          </div>
        )}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform .15s', color: 'var(--c-ink-400)' }}>
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Sessions list */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--c-line-soft)' }}>
          {sessions.map((s, idx) => {
            const isLive = !s.finishedAt
            const isHidden = s.hiddenFromDashboard
            const answered = s.progress?.answered ?? 0
            const total = s.progress?.total ?? 0
            return (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12, padding: isMobile ? '10px 14px' : '10px 18px 10px 66px', borderBottom: idx < sessions.length - 1 ? '1px solid var(--c-line-soft)' : 'none', background: isHidden ? 'rgba(0,0,0,.02)' : 'transparent', opacity: isHidden ? .7 : 1 }}>
                <span style={{ font: '600 11px/1 var(--font-mono)', color: 'var(--c-ink-400)', minWidth: 16 }}>#{idx + 1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                    <span className="kp-num" style={{ font: '700 15px/1 var(--font-display)', color: 'var(--c-ink)' }}>{s.totalScore}</span>
                    {isLive && <span className="kp-chip kp-chip--live" style={{ fontSize: 9 }}><span style={{width:4,height:4,borderRadius:'50%',background:'#c83a3a'}}/>играет</span>}
                    {!isLive && !isHidden && <span className="kp-chip kp-chip--ok" style={{ fontSize: 9 }}>готово</span>}
                    {isHidden && <span className="kp-chip kp-chip--mute" style={{ fontSize: 9 }}>скрыт</span>}
                    <span className="kp-num" style={{ font: '500 10px/1 var(--font-mono)', color: 'var(--c-ink-400)', marginLeft: 'auto' }}>
                      {new Date(s.startedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="kp-num" style={{ font: '500 10px/1 var(--font-mono)', color: 'var(--c-ink-400)', flexShrink: 0 }}>{answered}/{total}</span>
                    <div className="kp-progress" style={{ flex: 1, maxWidth: isMobile ? 80 : 140 }}>
                      <span style={{ width: `${(answered / (total || 1)) * 100}%` }} />
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <button title="Результаты" onClick={() => onViewSession(s)}
                    style={{ width: 26, height: 26, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid var(--c-line)', borderRadius: 6, color: 'var(--c-purple)', cursor: 'pointer' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" stroke="currentColor" strokeWidth="1.7"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7"/></svg>
                  </button>
                  <button title={isHidden ? 'Показать' : 'Скрыть'} onClick={() => onToggleVisibility(s)}
                    style={{ width: 26, height: 26, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid var(--c-line)', borderRadius: 6, color: 'var(--c-ink-400)', cursor: 'pointer' }}>
                    {isHidden
                      ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" stroke="currentColor" strokeWidth="1.7"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7"/></svg>
                      : <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M3 3l18 18M10.6 5.1A10.4 10.4 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6C3.7 8.5 2 12 2 12s4 7 10 7c1.7 0 3.3-.4 4.7-1.1M9.9 9.9a3 3 0 0 0 4.2 4.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
                    }
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
