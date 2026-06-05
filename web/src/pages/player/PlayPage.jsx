import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlayerHeader } from '../../components/PlayerHeader.jsx'
import { CaptchaShell } from '../../components/CaptchaShell.jsx'
import { Grid3x3Question, TilesQuestion, SliderQuestion, AudioQuestion, ImageCodeQuestion } from './QuestionTypes.jsx'
import { api } from '../../utils/api.js'
import { Mark } from '../../components/Brand.jsx'
import { createGameChannel } from '../../utils/gameChannel.js'

const KIND_LABELS = {
  grid3x3:   'ВЫБЕРИТЕ ВСЕ ПОДХОДЯЩИЕ',
  tiles:     'ВЫБЕРИТЕ ВСЕ КЛЕТКИ',
  slider:    'ПОТАЩИТЕ ОБЪЕКТ',
  audio:     'АУДИО · ТРАНСКРИБИРУЙТЕ',
  imageCode: 'КОД С КАРТИНКИ',
}

export default function PlayPage() {
  const navigate = useNavigate()
  const [state, setState] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const [delayLeft, setDelayLeft] = useState(0)   // ms оставшейся задержки
  const timerRef = useRef(null)
  const delayRef = useRef(null)
  const toastAdvanceRef = useRef(null)
  const channelRef = useRef(null)
  const [passive, setPassive] = useState(false)

  // Cross-tab coordination: only the earliest-mounted tab auto-submits
  useEffect(() => {
    const ch = createGameChannel(
      () => setPassive(true),
      () => setPassive(false),
    )
    channelRef.current = ch
    return () => ch.destroy()
  }, [])

  async function loadCurrent() {
    try {
      const data = await api.current()
      if (data.status === 'finished') { navigate('/result', { replace: true }); return }
      setState(data)
      setElapsed(0)
    } catch (err) {
      if (err.status === 401) { navigate('/', { replace: true }); return }
    }
  }

  useEffect(() => { loadCurrent() }, [])

  // Delay countdown — блокирует кнопку и останавливает таймер
  useEffect(() => {
    clearInterval(delayRef.current)
    if (!state?.question) return
    const delay = state.question.answerDelayMs ?? 0
    if (delay <= 0) { setDelayLeft(0); return }
    setDelayLeft(delay)
    delayRef.current = setInterval(() => {
      setDelayLeft(d => {
        if (d <= 250) { clearInterval(delayRef.current); return 0 }
        return d - 250
      })
    }, 250)
    return () => clearInterval(delayRef.current)
  }, [state?.question?.id])

  // Timer tick — стартует только после окончания delay
  useEffect(() => {
    clearInterval(timerRef.current)
    if (!state?.question) return
    const { startedAt, answerDelayMs = 0 } = state.question

    const tick = () => {
      const now = Date.now()
      const raw = now - startedAt
      // Не показываем время во время delay — таймер стоит
      const effective = Math.max(0, raw - answerDelayMs)
      setElapsed(raw < answerDelayMs ? 0 : effective)
    }

    timerRef.current = setInterval(tick, 250)
    tick()
    return () => clearInterval(timerRef.current)
  }, [state?.question?.id])

  // Auto-submit on timeout — только для активного таба (не пассивного)
  useEffect(() => {
    if (!state?.question || passive) return
    const { timeLimitMs, answerDelayMs = 0, startedAt } = state.question
    const totalBudget = timeLimitMs + answerDelayMs
    const remaining = totalBudget - (Date.now() - startedAt)
    if (remaining <= 0) { handleAnswer(getEmptyAnswer(state.question), true); return }
    const t = setTimeout(() => handleAnswer(getEmptyAnswer(state.question)), remaining)
    return () => clearTimeout(t)
  }, [state?.question?.id, passive])

  function getEmptyAnswer(question) {
    const t = question.type
    if (t === 'grid3x3' || t === 'tiles') return { selected: [] }
    if (t === 'slider') return { x: 0.5, y: 0.5 }
    return { text: '' }
  }

  // When tab returns to foreground after being hidden, advance a pending toast immediately
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && toastAdvanceRef.current) {
        toastAdvanceRef.current()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  async function handleAnswer(answerData, silent = false) {
    if (submitting || !state?.question) return
    setSubmitting(true)
    clearInterval(timerRef.current)
    clearInterval(delayRef.current)
    try {
      const result = await api.answer({ questionId: state.question.id, answerData })
      if (silent) {
        if (result.next === 'finished') { navigate('/result', { replace: true }); return }
        await loadCurrent()
        setSubmitting(false)
        return
      }
      setToast(result)
      const advance = async () => {
        toastAdvanceRef.current = null
        setToast(null)
        if (result.next === 'finished') { navigate('/result', { replace: true }); return }
        await loadCurrent()
        setSubmitting(false)
      }
      toastAdvanceRef.current = advance
      setTimeout(advance, 1500)
    } catch (err) {
      setSubmitting(false)
      if (err.code === 'session_finished') { navigate('/result', { replace: true }); return }
      if (err.code === 'already_answered') { await loadCurrent(); return }
    }
  }

  if (!state) return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--c-bg)' }}>
      <div style={{ font: '600 15px/1 var(--font-display)', color: 'var(--c-ink-500)' }}>Загрузка…</div>
    </div>
  )

  const q = state.question
  const timeLimitMs = q.timeLimitMs
  const elapsedClamped = Math.min(elapsed, timeLimitMs)
  const inDelay = delayLeft > 0

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--c-bg)', display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto', position: 'relative' }}>
      <div className="kp-stripe" />
      <PlayerHeader
        index={state.progress.index}
        total={state.progress.total}
        elapsedMs={elapsedClamped}
        timeLimitMs={timeLimitMs}
        paused={inDelay}
      />

      {/* Delay overlay banner */}
      {inDelay && (
        <div style={{
          background: 'var(--c-ink)', color: '#fff',
          padding: '8px 16px', textAlign: 'center',
          font: '600 12px/1.4 var(--font-display)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#76e08b', flexShrink: 0 }} />
          Прочитайте вопрос — {Math.ceil(delayLeft / 1000)}с
        </div>
      )}

      <CaptchaShell kind={KIND_LABELS[q.type] || q.type} title={q.title}>
        {q.type === 'grid3x3'   && <Grid3x3Question   key={q.id} question={q} onAnswer={handleAnswer} disabled={inDelay} />}
        {q.type === 'tiles'     && <TilesQuestion     key={q.id} question={q} onAnswer={handleAnswer} disabled={inDelay} />}
        {q.type === 'slider'    && <SliderQuestion    key={q.id} question={q} onAnswer={handleAnswer} disabled={inDelay} />}
        {q.type === 'audio'     && <AudioQuestion     key={q.id} question={q} onAnswer={handleAnswer} disabled={inDelay} />}
        {q.type === 'imageCode' && <ImageCodeQuestion key={q.id} question={q} onAnswer={handleAnswer} disabled={inDelay} />}
      </CaptchaShell>

      {/* Score toast overlay */}
      {toast && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, background: 'rgba(247,245,241,.6)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '28px 28px 24px', boxShadow: 'var(--shadow-pop)', border: '1px solid var(--c-line)', width: 280, textAlign: 'center' }}>
            <Mark size={40} style={{ marginBottom: 8 }} />
            <div style={{ font: '800 64px/.95 var(--font-display)', letterSpacing: '-.04em', background: 'var(--grad)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
              +{toast.score}
            </div>
            <div style={{ font: '600 13px/1 var(--font-display)', color: 'var(--c-ink-500)', marginTop: 2 }}>баллов</div>
            {toast.partialRatio != null && toast.partialRatio > 0 && toast.partialRatio < 1 && (
              <div style={{ marginTop: 8, font: '500 12px/1 var(--font-display)', color: 'var(--c-warn)' }}>
                Частично верно · {Math.round(toast.partialRatio * 100)}%
              </div>
            )}
            <div style={{ marginTop: 14, padding: '10px 0', borderTop: '1px solid var(--c-line-soft)', borderBottom: '1px solid var(--c-line-soft)', display: 'flex', justifyContent: 'space-around', font: '500 11px/1 var(--font-display)', color: 'var(--c-ink-500)' }}>
              <div>
                <div className="kp-num" style={{ font: '700 16px/1 var(--font-display)', color: 'var(--c-ink)' }}>{Math.round(toast.elapsedMs / 1000)}с</div>
                <div style={{ marginTop: 4 }}>время</div>
              </div>
              <div style={{ width: 1, background: 'var(--c-line-soft)' }} />
              <div>
                <div className="kp-num" style={{ font: '700 16px/1 var(--font-display)', color: toast.correct ? 'var(--c-ok)' : 'var(--c-err)' }}>
                  {toast.correct ? '✓' : '✗'}
                </div>
                <div style={{ marginTop: 4 }}>{toast.correct ? 'верно' : 'неверно'}</div>
              </div>
            </div>
            <div style={{ marginTop: 14, font: '500 12px/1.4 var(--font-display)', color: 'var(--c-ink-500)' }}>
              Следующий вопрос загружается…
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
