/* global React, Mark, Logo, MarkField */
// /dashboard — fullscreen top-10. For projector/TV. Designed at 1920×1080.

function DashboardScreen() {
  const top = [
    { rank: 1,  name: 'Соколова А.',  score: 880, delta: '+12', isNew: false, change: 0  },
    { rank: 2,  name: 'Ким Д.',       score: 820, delta: null,  isNew: false, change: 0  },
    { rank: 3,  name: 'Войтенко И.',  score: 720, delta: '+3',  isNew: false, change: +1 },
    { rank: 4,  name: 'Громова Ю.',   score: 660, delta: null,  isNew: false, change: -1 },
    { rank: 5,  name: 'Беляков А.',   score: 580, delta: null,  isNew: false, change: 0  },
    { rank: 6,  name: 'Иванов П.',    score: 540, delta: '+40', isNew: true,  change: +2 },
    { rank: 7,  name: 'Зайцева С.',   score: 510, delta: null,  isNew: false, change: -1 },
    { rank: 8,  name: 'Хан А.',       score: 490, delta: null,  isNew: false, change: -1 },
    { rank: 9,  name: 'Карпов Н.',    score: 470, delta: null,  isNew: false, change: 0  },
    { rank: 10, name: 'Орлова М.',    score: 410, delta: null,  isNew: false, change: +3 },
  ];

  const maxScore = top[0].score;

  return (
    <div style={{
      position: 'relative',
      width: 1920, height: 1080,
      background: 'linear-gradient(160deg,#1a1014 0%,#2a1a2e 50%,#1a0f12 100%)',
      color: '#fff',
      fontFamily: 'var(--font-display)',
      overflow: 'hidden'
    }}>
      {/* faint background marks */}
      <MarkField count={20} opacity={.05} color="#fff" />

      {/* huge corner brand mark */}
      <Mark size={700} fill="gradient" style={{ position: 'absolute', right: -180, top: -200, opacity: .12 }} />

      {/* === HEADER === */}
      <div style={{
        position: 'absolute', left: 64, right: 64, top: 48,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Logo size={48} dark />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
          <Stat label="Играют сейчас" value="14" live />
          <Stat label="Завершили" value="47" />
          <Stat label="Лучший" value="880" tint />
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 20px',
            background: 'rgba(255,255,255,.06)',
            border: '1px solid rgba(255,255,255,.12)',
            borderRadius: 999,
            font: '600 16px/1 var(--font-display)',
            color: 'rgba(255,255,255,.9)'
          }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#76e08b', boxShadow: '0 0 12px #76e08b' }} />
            эфир · 02.06 · 15:24
          </div>
        </div>
      </div>

      {/* === TITLE === */}
      <div style={{ position: 'absolute', left: 64, top: 156 }}>
        <div style={{
          font: '600 22px/1 var(--font-display)',
          letterSpacing: '.22em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,.6)',
          marginBottom: 18
        }}>Топ-10 · станция «Сириус.Капча»</div>
        <h1 style={{
          margin: 0,
          font: '800 156px/.86 var(--font-display)',
          letterSpacing: '-.045em',
          background: 'linear-gradient(135deg,#fff 0%,#fff 60%,#E77B2E 110%)',
          WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'
        }}>
          Не бот.<br/>Не залётный.<br/>Свой.
        </h1>
      </div>

      {/* === LEADERBOARD — right column === */}
      <div style={{
        position: 'absolute',
        right: 64, top: 230,
        width: 880,
        display: 'flex', flexDirection: 'column', gap: 8
      }}>
        {top.map((row, i) => (
          <LeaderRow key={row.rank} row={row} maxScore={maxScore} />
        ))}

        {/* footer hint */}
        <div style={{
          marginTop: 24,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          font: '600 14px/1 var(--font-display)',
          color: 'rgba(255,255,255,.5)',
          letterSpacing: '.06em', textTransform: 'uppercase'
        }}>
          <span>Сканируй QR на стенде → пройди → попади сюда</span>
          <span>обновлено мгновение назад</span>
        </div>
      </div>

      {/* QR pylon bottom-left */}
      <div style={{
        position: 'absolute', left: 64, bottom: 64,
        display: 'flex', alignItems: 'center', gap: 24
      }}>
        <div style={{
          width: 180, height: 180,
          background: '#fff',
          borderRadius: 16,
          padding: 16,
          display: 'grid',
          gridTemplateColumns: 'repeat(21,1fr)',
          gridTemplateRows: 'repeat(21,1fr)',
          gap: 0
        }}>
          {/* deterministic QR-like pattern */}
          {Array.from({ length: 21 * 21 }).map((_, i) => {
            const x = i % 21, y = Math.floor(i / 21);
            // corner finders
            const isFinder =
              (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
            const ring = isFinder &&
              ((x === 0 || x === 6 || y === 0 || y === 6 ||
                x === 14 || x === 20 || y === 14 || y === 20) ||
               (x >= 2 && x <= 4 && y >= 2 && y <= 4) ||
               (x >= 16 && x <= 18 && y >= 2 && y <= 4) ||
               (x >= 2 && x <= 4 && y >= 16 && y <= 18));
            const dot = !isFinder && ((Math.sin(x * 13.1 + y * 7.7) + 1) / 2) > 0.55;
            return (
              <div key={i} style={{
                background: (ring || dot) ? '#1a0f12' : 'transparent'
              }} />
            );
          })}
        </div>
        <div>
          <div style={{ font: '600 14px/1 var(--font-display)', letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,.55)', marginBottom: 10 }}>
            Сыграть
          </div>
          <div style={{ font: '700 36px/1 var(--font-display)', letterSpacing: '-.025em' }}>
            kapcha.cf
          </div>
          <div style={{ font: '500 16px/1.4 var(--font-display)', color: 'rgba(255,255,255,.6)', marginTop: 8, maxWidth: 320 }}>
            7 капч · 4 мин · одна попытка
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, live, tint }) {
  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        font: '600 12px/1 var(--font-display)', letterSpacing: '.14em', textTransform: 'uppercase',
        color: 'rgba(255,255,255,.55)', marginBottom: 4
      }}>
        {live && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff5a5a', boxShadow: '0 0 8px #ff5a5a' }} />}
        {label}
      </div>
      <div className="kp-num" style={{
        font: '800 36px/1 var(--font-display)',
        letterSpacing: '-.03em',
        color: tint ? '#E77B2E' : '#fff'
      }}>{value}</div>
    </div>
  );
}

function LeaderRow({ row, maxScore }) {
  const isTop3 = row.rank <= 3;
  const fillPct = (row.score / maxScore) * 100;
  return (
    <div style={{
      position: 'relative',
      display: 'grid',
      gridTemplateColumns: '88px 1fr auto 80px',
      alignItems: 'center',
      gap: 28,
      padding: '20px 28px',
      borderRadius: 14,
      background: row.isNew
        ? 'linear-gradient(90deg, rgba(231,123,46,.18), rgba(129,67,135,.18))'
        : 'rgba(255,255,255,.04)',
      border: row.isNew
        ? '1px solid rgba(231,123,46,.5)'
        : '1px solid rgba(255,255,255,.06)',
      overflow: 'hidden'
    }}>
      {/* progress bg */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: `${fillPct}%`,
        background: isTop3
          ? 'linear-gradient(90deg, rgba(231,123,46,.25), rgba(129,67,135,.18))'
          : 'rgba(255,255,255,.04)',
        zIndex: 0
      }}/>
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span className="kp-num" style={{
          font: `${isTop3 ? '800' : '700'} ${isTop3 ? 64 : 52}px/.85 var(--font-display)`,
          letterSpacing: '-.05em',
          color: isTop3 ? '#fff' : 'rgba(255,255,255,.55)'
        }}>{row.rank}</span>
      </div>
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{
          font: `${isTop3 ? '700' : '600'} ${isTop3 ? 40 : 30}px/1 var(--font-display)`,
          letterSpacing: '-.022em',
          color: isTop3 ? '#fff' : 'rgba(255,255,255,.85)'
        }}>{row.name}</span>
        {row.isNew && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '5px 8px',
            background: '#E77B2E', color: '#fff',
            font: '700 11px/1 var(--font-display)',
            letterSpacing: '.08em', textTransform: 'uppercase',
            borderRadius: 4
          }}>
            <Mark size={10} fill="#fff" /> новый
          </span>
        )}
        {row.change > 0 && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#76e08b', font: '700 14px/1 var(--font-mono)' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12l7-7 7 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            {row.change}
          </span>
        )}
        {row.change < 0 && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,.45)', font: '700 14px/1 var(--font-mono)' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M12 19V5M19 12l-7 7-7-7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            {Math.abs(row.change)}
          </span>
        )}
      </div>
      <div style={{ position: 'relative', zIndex: 1, font: '600 14px/1 var(--font-mono)', color: 'rgba(255,255,255,.5)' }}>
        {row.delta || '—'}
      </div>
      <div className="kp-num" style={{
        position: 'relative', zIndex: 1,
        font: `${isTop3 ? '800' : '700'} ${isTop3 ? 44 : 34}px/1 var(--font-display)`,
        letterSpacing: '-.03em', textAlign: 'right',
        color: isTop3 ? '#E77B2E' : '#fff'
      }}>{row.score}</div>
    </div>
  );
}

Object.assign(window, { DashboardScreen });
