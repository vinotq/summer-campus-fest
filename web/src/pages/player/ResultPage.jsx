import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo, Mark, MarkField } from '../../components/Brand.jsx'
import { api } from '../../utils/api.js'

const MARK_PATH = "M189.063 8.748C178.539 13.486 167.668 18.38 156.556 18.38C145.772 18.38 133.587 13.769 121.422 9.166C103.663 2.446 85.947-4.258 72.702 3.431C59.843 10.815 59.789 27.425 59.734 44.451C59.693 57.298 59.651 70.381 54.106 79.917C49.356 87.933 40.97 96.732 32.198 105.937C16.702 122.197 0 139.723 0 156.427C0 172.894 12.202 185.066 24.522 197.356C31.774 204.591 39.067 211.866 43.937 220.083C48.573 227.905 52.2 238.116 55.933 248.625C62.782 267.903 69.987 288.183 84.43 296.569C97.398 304.097 111.331 297.825 125.934 291.251C136.458 286.514 147.331 281.619 158.443 281.619C169.227 281.619 181.413 286.23 193.578 290.835C211.337 297.555 229.052 304.257 242.297 296.569C255.156 289.185 255.21 272.574 255.265 255.548C255.306 242.702 255.349 229.619 260.894 220.083C266.154 211.206 275.873 203.428 285.638 195.611C300.268 183.904 315 172.116 315 156.427C315 138.323 300.252 119.254 286.812 101.877C280.83 94.144 275.109 86.746 271.062 79.917C266.426 72.094 262.799 61.884 259.065 51.375C252.217 32.097 245.012 11.816 230.57 3.431C217.6-4.098 203.667 2.174 189.063 8.748ZM168.859 112.061C168.219 112.913 166.863 112.551 166.737 111.495L158.655 43.676C158.49 42.290 156.471 42.290 156.306 43.676L148.267 111.14C148.141 112.197 146.784 112.559 146.145 111.706L105.286 57.257C104.448 56.139 102.699 57.145 103.252 58.427L130.258 121.064C130.679 122.041 129.687 123.031 128.704 122.611L65.804 95.725C64.516 95.175 63.507 96.916 64.629 97.751L119.536 138.6C120.391 139.237 120.028 140.588 118.967 140.713L50.760 148.772C49.369 148.936 49.369 150.947 50.760 151.111L118.792 159.148C119.853 159.274 120.216 160.625 119.360 161.262L64.620 201.988C63.497 202.823 64.506 204.565 65.794 204.015L128.719 177.117C129.700 176.697 130.693 177.687 130.272 178.665L103.262 241.313C102.709 242.595 104.457 243.6 105.296 242.482L146.131 188.064C146.771 187.212 148.127 187.574 148.253 188.630L156.306 256.323C156.471 257.709 158.490 257.709 158.655 256.323L166.690 188.851C166.816 187.795 168.172 187.434 168.811 188.286L209.738 242.788C210.575 243.901 212.318 242.898 211.770 241.618L184.700 178.405C184.282 177.428 185.273 176.439 186.254 176.857L249.157 203.685C250.448 204.236 251.456 202.49 250.330 201.656L195.466 161.04C194.611 160.406 194.971 159.061 196.027 158.928L264.205 150.314C265.595 150.138 265.583 148.130 264.190 147.974L196.227 140.353C195.167 140.234 194.798 138.886 195.651 138.247L250.336 97.292C251.456 96.453 250.448 94.717 249.158 95.270L186.246 122.222C185.265 122.642 184.273 121.652 184.694 120.674L211.751 57.821C212.301 56.541 210.561 55.535 209.722 56.648L168.859 112.061Z"

function markSvg(size, fill, extraStyle = '') {
  return `<svg width="${size}" height="${size}" viewBox="0 0 315 300" style="display:inline-block;vertical-align:middle;flex-shrink:0;${extraStyle}" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" fill="${fill}" d="${MARK_PATH}"/></svg>`
}

function buildMarkField(count = 14, opacity = 0.055, color = '#fff') {
  const rng = i => { const x = Math.sin(i * 9301 + 49297) * 233280; return x - Math.floor(x) }
  return Array.from({ length: count }, (_, i) => {
    const x = rng(i * 2) * 100
    const y = rng(i * 2 + 1) * 100
    const s = 14 + rng(i * 3) * 36
    const r = (rng(i * 5) - 0.5) * 60
    return `<div style="position:absolute;left:${x}%;top:${y}%;transform:translate(-50%,-50%) rotate(${r}deg);opacity:${opacity};pointer-events:none">${markSvg(s, color)}</div>`
  }).join('')
}

function printCert({ lastName, firstName, totalScore, rank, today }) {
  const win = window.open('', '_blank', 'width=1200,height=900')
  if (!win) { alert('Разрешите всплывающие окна для этого сайта'); return }

  const logoMark = markSvg(22, 'url(#logoGrad)')
  const bigWatermark = markSvg(320, 'rgba(255,255,255,0.07)', 'position:absolute;right:-60px;top:-80px;pointer-events:none')
  const fieldMarks = buildMarkField(14, 0.055, '#fff')

  win.document.write(`<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<title>Сертификат — ${escHtml(lastName)} ${escHtml(firstName)}</title>
<style>
  @page { size: A4 landscape; margin: 0; }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    width: 297mm; height: 210mm;
    overflow: hidden;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .cert {
    width: 297mm; height: 210mm;
    position: relative;
    background: linear-gradient(145deg, #1c0e24 0%, #2e1640 45%, #3f2050 70%, #2a1428 100%);
    font-family: 'Helvetica Neue', Arial, sans-serif;
    overflow: hidden;
  }
  .stripe {
    position: absolute; left: 0; top: 0; bottom: 0; width: 8px;
    background: linear-gradient(180deg, #E77B2E 0%, #814387 100%);
  }
  .inner {
    position: absolute; inset: 0 0 0 8px;
    display: grid; grid-template-rows: auto 1fr auto;
    padding: 20px 28px 20px 28px; gap: 0;
  }
  .top-bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
  .logo { display: inline-flex; align-items: center; gap: 10px; }
  .logo-text { font: 700 20px/1 'Helvetica Neue', Arial, sans-serif; color: #fff; letter-spacing: -.02em; }
  .logo-dot { color: #E77B2E; }
  .cert-label { font: 600 11px/1 monospace; letter-spacing: .2em; text-transform: uppercase; color: rgba(255,255,255,.5); }
  .main { display: grid; grid-template-columns: 1fr 150px; gap: 24px; align-items: center; }
  .confirmed { font: 500 11px/1 sans-serif; letter-spacing: .24em; text-transform: uppercase; color: rgba(255,255,255,.45); margin-bottom: 14px; }
  .name-last { font: 800 64px/.88 sans-serif; letter-spacing: -.03em; color: #fff; margin-bottom: 8px; }
  .name-first { font: 800 64px/.88 sans-serif; letter-spacing: -.03em; color: #E77B2E; }
  .tagline { margin-top: 18px; font: 400 13px/1.5 sans-serif; color: rgba(255,255,255,.6); max-width: 380px; }
  .badge { display: flex; align-items: center; justify-content: center; width: 140px; height: 140px; border-radius: 50%; border: 2px dashed rgba(255,255,255,.35); font: 700 13px/1.45 sans-serif; letter-spacing: .12em; text-transform: uppercase; color: rgba(255,255,255,.65); text-align: center; align-self: center; }
  .footer { border-top: 1px solid rgba(255,255,255,.12); padding-top: 14px; display: flex; align-items: flex-end; gap: 40px; }
  .stat-label { font: 600 10px/1 sans-serif; letter-spacing: .22em; text-transform: uppercase; color: rgba(255,255,255,.45); margin-bottom: 6px; }
  .stat-big { font: 800 72px/.85 sans-serif; letter-spacing: -.04em; color: #fff; }
  .stat-sub { font: 500 11px/1 sans-serif; color: rgba(255,255,255,.55); margin-top: 5px; }
  .rank-big { font: 800 52px/.85 sans-serif; letter-spacing: -.04em; color: #E77B2E; }
  .footer-mark { margin-left: auto; opacity: .3; align-self: flex-end; }
  @media screen {
    body { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #111; }
    .cert { box-shadow: 0 8px 48px rgba(0,0,0,.6); }
  }
</style>
</head>
<body>
<div class="cert">
  <svg width="0" height="0" style="position:absolute"><defs><linearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#E77B2E"/><stop offset="100%" stop-color="#814387"/></linearGradient></defs></svg>
  <div style="position:absolute;inset:0;overflow:hidden;pointer-events:none">${fieldMarks}</div>
  ${bigWatermark}
  <div class="stripe"></div>
  <div class="inner">
    <div class="top-bar">
      <div class="logo">${logoMark}<span class="logo-text">Сириус<span class="logo-dot">.</span>Капча</span></div>
      <span class="cert-label">Сертификат · ${today}</span>
    </div>
    <div class="main">
      <div>
        <div class="confirmed">Подтверждено, что</div>
        <div class="name-last">${escHtml(lastName || '—')}</div>
        <div class="name-first">${escHtml(firstName || '')}</div>
        <div class="tagline">является студентом, а не ботом, и достоин жить в общежитии Кампуса Сириуса.</div>
      </div>
      <div class="badge">Кампус<br>Фест<br>2026</div>
    </div>
    <div class="footer">
      <div>
        <div class="stat-label">Итог</div>
        <div class="stat-big">${totalScore}</div>
        <div class="stat-sub">баллов</div>
      </div>
      ${rank ? `<div>
        <div class="stat-label">Место</div>
        <div class="rank-big">${rank}</div>
        <div class="stat-sub">топ‑10</div>
      </div>` : ''}
      <div class="footer-mark">${markSvg(44, 'rgba(255,255,255,1)')}</div>
    </div>
  </div>
</div>
<script>
  window.onload = function() { setTimeout(function() { window.print(); }, 300); };
<\/script>
</body>
</html>`)
  win.document.close()
}

function escHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export default function ResultPage() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [history, setHistory] = useState(null)

  const [confirmReplay, setConfirmReplay] = useState(false)
  const [replaying, setReplaying] = useState(false)
  const [replayError, setReplayError] = useState('')

  useEffect(() => {
    api.result().then(r => {
      if (r.status !== 'finished') navigate('/play', { replace: true })
      else setData(r.result)
    }).catch(() => navigate('/play', { replace: true }))

    api.sessionHistory().then(r => setHistory(r)).catch(() => {})
  }, [])

  const today = new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })

  async function replay() {
    setReplaying(true)
    setReplayError('')
    try {
      await api.start({ lastName: data.lastName, firstName: data.firstName })
      localStorage.setItem('cf_played', '1')
      navigate('/play', { replace: true })
    } catch (err) {
      if (err.code === 'max_attempts') {
        setReplayError('Достигнут лимит попыток (3). Попробуйте с другим именем.')
      } else {
        setReplayError(err.message || 'Ошибка запуска')
      }
      setReplaying(false)
      setConfirmReplay(false)
    }
  }

  if (!data) return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--c-bg)' }}>
      <div style={{ font: '600 15px/1 var(--font-display)', color: 'var(--c-ink-500)' }}>Загрузка…</div>
    </div>
  )

  const correctCount = data.answers.filter(a => a.correct).length
  const attemptsLeft = history ? Math.max(0, 3 - history.attempts.length) : null

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--c-bg)', display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto' }}>

      {/* ── Certificate (A4 landscape proportion) ── */}
      <div style={{
        width: '100%',
        aspectRatio: '297 / 210',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(145deg, #1c0e24 0%, #2e1640 45%, #3f2050 70%, #2a1428 100%)',
        boxSizing: 'border-box',
        flexShrink: 0,
      }}>
        <MarkField count={14} opacity={.055} color="#fff" />
        <Mark size={280} fill="#fff" style={{ position: 'absolute', right: -40, top: -70, opacity: .07, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, background: 'linear-gradient(180deg, #E77B2E 0%, #814387 100%)' }} />
        <div style={{ position: 'absolute', inset: '0 0 0 5px', display: 'grid', gridTemplateRows: 'auto 1fr auto', padding: '16px 20px 14px 22px', gap: 0, boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <Logo size={15} dark />
            <span style={{ font: '600 7px/1 var(--font-mono)', letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)' }}>СЕРТИФИКАТ · {today}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 12, alignItems: 'center' }}>
            <div>
              <div style={{ font: '500 7px/1 var(--font-display)', letterSpacing: '.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', marginBottom: 8 }}>Подтверждено, что</div>
              <div style={{ font: '800 26px/.88 var(--font-display)', letterSpacing: '-.03em', color: '#fff', marginBottom: 4 }}>{data.lastName || '—'}</div>
              <div style={{ font: '800 26px/.88 var(--font-display)', letterSpacing: '-.03em', color: '#E77B2E' }}>{data.firstName || ''}</div>
              <div style={{ marginTop: 10, font: '400 9px/1.45 var(--font-display)', color: 'rgba(255,255,255,.6)', maxWidth: 260 }}>
                является студентом, а не ботом, и достоин жить в общежитии Кампуса Сириуса.
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 76, height: 76, borderRadius: '50%', border: '1.5px dashed rgba(255,255,255,.35)', font: '700 7px/1.35 var(--font-display)', letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.65)', textAlign: 'center', alignSelf: 'center' }}>
              Кампус<br />Фест<br />2026
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,.12)', paddingTop: 10, display: 'flex', alignItems: 'flex-end', gap: 24 }}>
            <div>
              <div style={{ font: '600 6px/1 var(--font-display)', letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', marginBottom: 4 }}>Итог</div>
              <div style={{ font: '800 38px/.85 var(--font-display)', letterSpacing: '-.04em', color: '#fff' }}>{data.totalScore}</div>
              <div style={{ font: '500 7px/1 var(--font-display)', color: 'rgba(255,255,255,.55)', marginTop: 3 }}>баллов</div>
            </div>
            {data.rank && (
              <div>
                <div style={{ font: '600 6px/1 var(--font-display)', letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', marginBottom: 4 }}>Место</div>
                <div style={{ font: '800 26px/.85 var(--font-display)', letterSpacing: '-.04em', color: '#E77B2E' }}>{data.rank}</div>
                <div style={{ font: '500 7px/1 var(--font-display)', color: 'rgba(255,255,255,.45)', marginTop: 3 }}>топ‑10</div>
              </div>
            )}
            <div style={{ marginLeft: 'auto', opacity: .35 }}><Mark size={32} fill="#fff" /></div>
          </div>
        </div>
      </div>

      {/* ── Overtaken ── */}
      {data.overtaken && data.overtaken.length > 0 && (() => {
        const myName = `${data.lastName} ${data.firstName}`
        const beatSelf = data.overtaken.find(p => p.name === myName)
        const others = data.overtaken.filter(p => p.name !== myName)
        return (
          <div style={{ margin: '12px 16px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {beatSelf && (
              <div style={{ padding: '10px 14px', background: 'linear-gradient(90deg, rgba(129,67,135,.1), rgba(129,67,135,.05))', border: '1px solid rgba(129,67,135,.3)', borderRadius: 10 }}>
                <div style={{ font: '600 11px/1 var(--font-display)', color: 'var(--c-purple)', marginBottom: 4 }}>Личный рекорд побит</div>
                <div style={{ font: '500 12px/1 var(--font-display)', color: 'var(--c-ink-500)' }}>
                  Прошлый лучший: <span className="kp-num" style={{ font: '600 12px/1 var(--font-mono)', color: 'var(--c-ink-400)' }}>{beatSelf.totalScore} б</span>
                </div>
              </div>
            )}
            {others.length > 0 && (
              <div style={{ padding: '10px 14px', background: 'linear-gradient(90deg, rgba(231,123,46,.1), rgba(129,67,135,.08))', border: '1px solid rgba(231,123,46,.3)', borderRadius: 10 }}>
                <div style={{ font: '600 11px/1 var(--font-display)', color: 'var(--c-orange)', marginBottom: 7 }}>Вы опередили</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {others.map((p, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ font: '500 12px/1 var(--font-display)', color: 'var(--c-ink-700)' }}>{p.name}</span>
                      <span className="kp-num" style={{ font: '600 12px/1 var(--font-mono)', color: 'var(--c-ink-400)' }}>{p.totalScore} б</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })()}

      {/* ── Breakdown ── */}
      <div style={{ padding: '14px 16px 0', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
          <h3 style={{ margin: 0, font: '700 14px/1 var(--font-display)' }}>По вопросам</h3>
          <span style={{ font: '500 12px/1 var(--font-display)', color: 'var(--c-ink-500)' }}>{correctCount}/{data.answers.length} правильно</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {data.answers.map((a, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '14px 1fr auto auto', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--c-line-soft)', font: '500 12.5px/1 var(--font-display)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: a.correct ? 'var(--c-ok)' : 'var(--c-err)', display: 'inline-block' }} />
              <span style={{ color: 'var(--c-ink)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>Вопрос {i + 1}</span>
              <span className="kp-num" style={{ color: 'var(--c-ink-500)', font: '500 11px/1 var(--font-mono)' }}>{Math.round(a.elapsedMs / 1000)}с</span>
              <span className="kp-num" style={{ font: '700 13px/1 var(--font-display)', color: a.correct ? 'var(--c-ink)' : 'var(--c-ink-400)', minWidth: 38, textAlign: 'right' }}>+{a.score}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── История попыток ── */}
      {history && history.attempts.length > 1 && (
        <div style={{ margin: '16px 16px 0', padding: '12px 14px', background: '#fff', border: '1px solid var(--c-line)', borderRadius: 12 }}>
          <div style={{ font: '600 12px/1 var(--font-display)', color: 'var(--c-ink-700)', marginBottom: 10 }}>
            Все попытки
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {history.attempts.map((attempt) => {
              const isCurrent = attempt.sessionId === (data.sessionId ?? null)
              return (
                <div key={attempt.sessionId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: isCurrent ? 'var(--c-purple-50)' : 'var(--c-bg)', border: `1px solid ${isCurrent ? 'var(--c-purple)' : 'var(--c-line-soft)'}` }}>
                  <span style={{ font: '700 11px/1 var(--font-mono)', color: 'var(--c-ink-400)', minWidth: 16 }}>{attempt.index}</span>
                  <div style={{ flex: 1 }}>
                    <div className="kp-num" style={{ font: '700 16px/1 var(--font-display)', color: 'var(--c-ink)' }}>{attempt.totalScore} <span style={{ font: '500 11px/1', color: 'var(--c-ink-400)' }}>баллов</span></div>
                    {attempt.rank && <div style={{ font: '500 10px/1 var(--font-display)', color: 'var(--c-orange)', marginTop: 3 }}>#{attempt.rank} в топе</div>}
                  </div>
                  <button
                    onClick={() => printCert({ lastName: history.lastName, firstName: history.firstName, totalScore: attempt.totalScore, rank: attempt.rank, today })}
                    style={{ height: 30, padding: '0 10px', border: '1px solid var(--c-line)', borderRadius: 8, background: '#fff', font: '600 11px/1 var(--font-display)', color: 'var(--c-ink-500)', cursor: 'pointer', flexShrink: 0 }}>
                    Сертификат
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Actions ── */}
      <div style={{ padding: '16px 16px 28px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {replayError && (
          <p style={{ margin: 0, color: 'var(--c-err)', font: '500 12px/1.3 var(--font-display)', textAlign: 'center' }}>{replayError}</p>
        )}

        {confirmReplay ? (
          <div style={{ padding: '14px 16px', background: 'var(--c-purple-50)', border: '1.5px solid var(--c-purple)', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ font: '600 13px/1.4 var(--font-display)', color: 'var(--c-ink)' }}>
              Запустить новую игру?
              {history && (
                <div style={{ font: '500 14px/1.3', color: 'var(--c-ink-500)', marginTop: 4 }}>
                  Это будет попытка {history.attempts.length + 1} из 3
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="kp-btn kp-btn--ghost" style={{ flex: 1, height: 44 }} onClick={() => { setConfirmReplay(false); setReplayError('') }}>
                Отмена
              </button>
              <button className="kp-btn kp-btn--primary" style={{ flex: 1, height: 44 }} onClick={replay} disabled={replaying}>
                {replaying ? 'Запуск…' : 'Да, играть снова'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            {attemptsLeft !== 0 && (
              <button className="kp-btn kp-btn--ghost" style={{ flex: 1, height: 48 }} onClick={() => setConfirmReplay(true)}>
                Перепройти
              </button>
            )}
            {attemptsLeft !== 0 && (
              <button className="kp-btn kp-btn--solid" style={{ flex: 1, height: 48 }}
                onClick={() => printCert({ lastName: data.lastName, firstName: data.firstName, totalScore: data.totalScore, rank: data.rank, today })}>
                Сертификат
              </button>
            )}
          </div>
        )}
      </div>

    </div>
  )
}
