/* global React, Mark, Logo, MarkField, IOSDevice */
// /result — final score + sharable poster-style certificate.

function ResultScreen() {
  const totalScore = 540;
  const rank = 3;
  const totalPlayers = 47;
  const answers = [
    { type: 'grid3x3', title: 'Просроченные продукты', score: 80, correct: true,  elapsed: 12 },
    { type: 'tiles',   title: 'Парковка велосипедов', score: 92, correct: true,  elapsed: 18 },
    { type: 'slider',  title: 'Пылесос в подъезде',   score: 0,  correct: false, elapsed: 28 },
    { type: 'audio',   title: 'Что вы слышите',       score: 120,correct: true,  elapsed: 8  },
    { type: 'slider',  title: 'СКУД к подъезду',       score: 88, correct: true,  elapsed: 22 },
    { type: 'imageCode',title:'Код с акта',            score: 100,correct: true,  elapsed: 4  },
    { type: 'grid3x3', title: 'Алкоголь и вейпы',      score: 60, correct: true,  elapsed: 31 },
  ];

  return (
    <IOSDevice dark>
      <div style={{
        position: 'relative', height: '100%', overflow: 'hidden',
        background: 'var(--c-bg)',
        display: 'flex', flexDirection: 'column'
      }}>
        {/* === The CERTIFICATE / POSTER — top half === */}
        <div style={{
          position: 'relative',
          padding: '60px 16px 20px',
          background: 'linear-gradient(160deg,#814387 0%,#5a2f60 60%,#E77B2E 130%)',
          color: '#fff',
          overflow: 'hidden'
        }}>
          {/* decorative mark field */}
          <MarkField count={18} opacity={.16} color="#fff" />

          {/* header strip */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
            <Logo size={18} dark />
            <span style={{
              font: '600 9.5px/1 var(--font-mono)',
              letterSpacing: '.15em', textTransform: 'uppercase',
              opacity: .8
            }}>СЕРТИФИКАТ · 02 / 06 / 2026</span>
          </div>

          {/* big stamp */}
          <Mark size={120} fill="#fff" style={{ position: 'absolute', right: -28, top: 56, opacity: .15 }} />

          <div style={{ marginTop: 22, position: 'relative' }}>
            <div style={{
              font: '600 11px/1 var(--font-display)',
              letterSpacing: '.18em', textTransform: 'uppercase',
              opacity: .8, marginBottom: 10
            }}>Подтверждено, что</div>
            <div style={{
              font: '800 36px/.95 var(--font-display)',
              letterSpacing: '-.03em'
            }}>Иванов<br />Пётр</div>
            <div style={{
              marginTop: 14, font: '500 14px/1.4 var(--font-display)',
              opacity: .85, maxWidth: 280
            }}>
              является студентом, а не ботом, и достоин жить в общежитии КампусФеста.
            </div>
          </div>

          {/* big score block */}
          <div style={{
            marginTop: 18,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
            position: 'relative'
          }}>
            <div>
              <div className="kp-eyebrow" style={{ color: 'rgba(255,255,255,.7)' }}>Итог</div>
              <div className="kp-num" style={{
                font: '800 76px/.85 var(--font-display)',
                letterSpacing: '-.05em'
              }}>{totalScore}</div>
              <div style={{ font: '600 13px/1 var(--font-display)', opacity: .85, marginTop: 2 }}>очков</div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div className="kp-eyebrow" style={{ color: 'rgba(255,255,255,.7)' }}>Место</div>
              <div className="kp-num" style={{
                font: '800 38px/1 var(--font-display)',
                letterSpacing: '-.03em'
              }}>{rank}<span style={{ font: '600 18px/1 var(--font-display)', opacity: .7 }}>/{totalPlayers}</span></div>
              <div style={{ font: '500 11px/1 var(--font-display)', opacity: .7, marginTop: 4 }}>из живых сейчас</div>
            </div>
          </div>

          {/* signature row */}
          <div style={{
            marginTop: 18, paddingTop: 14,
            borderTop: '1px solid rgba(255,255,255,.2)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
            position: 'relative'
          }}>
            <div>
              <div style={{ font: '600 10px/1 var(--font-display)', opacity: .65, letterSpacing: '.1em', textTransform: 'uppercase' }}>Подпись</div>
              <div style={{
                marginTop: 4,
                font: '600 18px/1 "Caveat", "Segoe Script", cursive',
                opacity: .9
              }}>Комендантский ИИ</div>
            </div>
            <div className="kp-stamp" style={{ position: 'relative' }}>
              Кампус<br/>Фест<br/>2026
            </div>
          </div>
        </div>

        {/* === Breakdown + actions — bottom half === */}
        <div style={{ padding: '16px 16px 0', flex: 1, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
            <h3 style={{ margin: 0, font: '700 14px/1 var(--font-display)' }}>По вопросам</h3>
            <span style={{ font: '500 12px/1 var(--font-display)', color: 'var(--c-ink-500)' }}>
              6/7 правильно
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {answers.slice(0, 5).map((a, i) => (
              <div key={i} style={{
                display: 'grid',
                gridTemplateColumns: '14px 1fr auto auto',
                alignItems: 'center',
                gap: 10,
                padding: '8px 0',
                borderBottom: '1px solid var(--c-line-soft)',
                font: '500 12.5px/1 var(--font-display)'
              }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: a.correct ? 'var(--c-ok)' : 'var(--c-err)',
                  display: 'inline-block'
                }} />
                <span style={{ color: 'var(--c-ink)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{a.title}</span>
                <span className="kp-num" style={{ color: 'var(--c-ink-500)', font: '500 11px/1 var(--font-mono)' }}>{a.elapsed}с</span>
                <span className="kp-num" style={{
                  font: '700 13px/1 var(--font-display)',
                  color: a.correct ? 'var(--c-ink)' : 'var(--c-ink-400)',
                  minWidth: 38, textAlign: 'right'
                }}>+{a.score}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{
          padding: '12px 16px 22px',
          background: 'linear-gradient(to top, #fff 80%, rgba(255,255,255,0))',
          display: 'flex', gap: 8
        }}>
          <button className="kp-btn kp-btn--primary" style={{ flex: 2 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 3v12M7 10l5 5 5-5M5 21h14" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Скачать
          </button>
          <button className="kp-btn kp-btn--ghost" style={{ flex: 1, padding: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </div>
    </IOSDevice>
  );
}

Object.assign(window, { ResultScreen });
