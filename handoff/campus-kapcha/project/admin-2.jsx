/* global React, Mark, Logo, ChromeWindow, AdminSidebar, AdminTopbar */
// /admin/players — dense live table.

function AdminPlayersScreen() {
  const players = [
    { id: 1, last: 'Соколова', first: 'Анна',     init: 'А', start: '14:02:18', dur: '03:42', progress: 7, total: 7, score: 880, status: 'finished', hidden: false },
    { id: 2, last: 'Ким',      first: 'Дмитрий',  init: 'Д', start: '14:04:51', dur: '03:18', progress: 7, total: 7, score: 820, status: 'finished', hidden: false },
    { id: 3, last: 'Иванов',   first: 'Пётр',     init: 'П', start: '14:08:02', dur: '04:11', progress: 7, total: 7, score: 540, status: 'finished', hidden: false },
    { id: 4, last: 'Орлова',   first: 'Маша',     init: 'М', start: '14:11:30', dur: '02:14', progress: 5, total: 7, score: 410, status: 'live',     hidden: false },
    { id: 5, last: 'Гаджиев',  first: 'Тимур',    init: 'Т', start: '14:12:48', dur: '01:42', progress: 4, total: 7, score: 360, status: 'live',     hidden: false },
    { id: 6, last: 'Лебедева', first: 'Ксения',   init: 'К', start: '14:14:02', dur: '01:01', progress: 2, total: 7, score: 180, status: 'live',     hidden: false },
    { id: 7, last: 'Тест',     first: 'Тестов',   init: 'Т', start: '14:15:08', dur: '00:24', progress: 1, total: 7, score: 80,  status: 'live',     hidden: true  },
    { id: 8, last: 'Войтенко', first: 'Илья',     init: 'И', start: '13:59:12', dur: '04:55', progress: 7, total: 7, score: 720, status: 'finished', hidden: false },
    { id: 9, last: 'Громова',  first: 'Юля',      init: 'Ю', start: '13:54:31', dur: '05:11', progress: 7, total: 7, score: 660, status: 'finished', hidden: false },
    { id:10, last: 'Беляков',  first: 'Артём',    init: 'А', start: '13:51:08', dur: '04:33', progress: 7, total: 7, score: 580, status: 'finished', hidden: false },
    { id:11, last: 'Зайцева',  first: 'Софья',    init: 'С', start: '13:48:55', dur: '04:42', progress: 7, total: 7, score: 510, status: 'finished', hidden: false },
    { id:12, last: 'Хан',      first: 'Алия',     init: 'А', start: '13:45:23', dur: '03:58', progress: 7, total: 7, score: 490, status: 'finished', hidden: false },
    { id:13, last: 'Карпов',   first: 'Никита',   init: 'Н', start: '13:42:10', dur: '04:18', progress: 7, total: 7, score: 470, status: 'finished', hidden: false },
    { id:14, last: 'Жукова',   first: 'Аня',      init: 'А', start: '13:39:01', dur: '00:42', progress: 0, total: 7, score: 0,   status: 'abandoned',hidden: false },
  ];

  const maxScore = 1000;
  const stats = [
    { label: 'Сейчас играют', value: 4,  tone: 'live' },
    { label: 'Завершили',      value: 9 },
    { label: 'Скрытые',        value: 1, tone: 'mute' },
    { label: 'Средний счёт',   value: 538 },
    { label: 'Лучший',         value: 880, tone: 'orange' },
  ];

  return (
    <ChromeWindow width={1280} height={820} url="kapcha.campusfest.ru/admin/players">
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', width: '100%', height: '100%', background: '#f6f4f0' }}>
        <AdminSidebar active="players" />
        <main style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <AdminTopbar
            title="Игроки"
            subtitle="Лайв-список всех попыток. 14 онлайн, 47 за сегодня."
            right={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px',
                  height: 36, border: '1px solid var(--c-line)', borderRadius: 8, background: '#fff',
                  font: '500 13px/1 var(--font-display)', color: 'var(--c-ink-500)', minWidth: 240
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7"/><path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
                  Поиск по имени…
                </div>
                <button className="kp-btn kp-btn--ghost" style={{ height: 36 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
                  Фильтры
                </button>
                <button className="kp-btn kp-btn--ghost" style={{ height: 36 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 3v12M7 10l5 5 5-5M5 21h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  CSV
                </button>
              </div>
            }
          />

          {/* stats strip */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5,1fr)',
            gap: 1, background: 'var(--c-line)',
            borderBottom: '1px solid var(--c-line)'
          }}>
            {stats.map(s => (
              <div key={s.label} style={{ background: '#fff', padding: '14px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  {s.tone === 'live' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#c83a3a' }} />}
                  <span className="kp-eyebrow" style={{ color: 'var(--c-ink-500)' }}>{s.label}</span>
                </div>
                <div className="kp-num" style={{
                  font: '700 22px/1 var(--font-display)',
                  letterSpacing: '-.02em',
                  color: s.tone === 'orange' ? 'var(--c-orange)' : s.tone === 'mute' ? 'var(--c-ink-400)' : 'var(--c-ink)'
                }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div style={{ flex: 1, overflow: 'auto', background: '#fff' }}>
            <table className="kp-table">
              <thead>
                <tr>
                  <th style={{ width: 28 }}></th>
                  <th>Игрок</th>
                  <th>Старт</th>
                  <th>Длительность</th>
                  <th>Прогресс</th>
                  <th>Очки</th>
                  <th>Статус</th>
                  <th style={{ width: 110, textAlign: 'right' }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {players.map(p => {
                  const isLive = p.status === 'live';
                  const isHidden = p.hidden;
                  const isAbandoned = p.status === 'abandoned';
                  return (
                    <tr key={p.id} style={isHidden ? { opacity: .55 } : null}>
                      <td>
                        {isLive ? (
                          <span style={{
                            display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                            background: '#c83a3a', boxShadow: '0 0 0 3px rgba(200,58,58,.18)'
                          }} />
                        ) : isAbandoned ? (
                          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--c-ink-300)' }} />
                        ) : (
                          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--c-ok)' }} />
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: '50%',
                            background: isLive ? 'var(--grad)' : 'var(--c-line-soft)',
                            color: isLive ? '#fff' : 'var(--c-ink-700)',
                            font: '700 12px/1 var(--font-display)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>{p.init}</div>
                          <div>
                            <div style={{ font: '600 13.5px/1.1 var(--font-display)', color: 'var(--c-ink)' }}>
                              {p.last} {p.first}
                            </div>
                            <div className="kp-num" style={{ font: '500 10.5px/1 var(--font-mono)', color: 'var(--c-ink-400)', marginTop: 3 }}>
                              #{String(p.id).padStart(4,'0')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="kp-num" style={{ font: '500 12.5px/1 var(--font-mono)', color: 'var(--c-ink-700)' }}>{p.start}</td>
                      <td className="kp-num" style={{ font: '500 12.5px/1 var(--font-mono)', color: 'var(--c-ink-700)' }}>{p.dur}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="kp-num" style={{ font: '600 12.5px/1 var(--font-mono)', minWidth: 32 }}>{p.progress}/{p.total}</span>
                          <div className="kp-progress" style={{ width: 70 }}>
                            <span style={{ width: `${(p.progress/p.total)*100}%` }}></span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="kp-num" style={{ font: '700 14px/1 var(--font-display)', minWidth: 40 }}>{p.score}</span>
                          <span className="kp-score-bar"><span style={{ width: `${(p.score/maxScore)*100}%` }}></span></span>
                        </div>
                      </td>
                      <td>
                        {isLive && <span className="kp-chip kp-chip--live"><span style={{width:5,height:5,borderRadius:'50%',background:'#c83a3a'}}/>играет</span>}
                        {p.status === 'finished' && !isHidden && <span className="kp-chip kp-chip--ok">завершил</span>}
                        {isHidden && <span className="kp-chip kp-chip--mute">скрыт</span>}
                        {isAbandoned && <span className="kp-chip kp-chip--mute">бросил</span>}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 4 }}>
                          <button title="Скрыть с дашборда" style={iconBtn}>
                            {isHidden ? (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" stroke="currentColor" strokeWidth="1.7"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7"/></svg>
                            ) : (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 3l18 18M10.6 5.1A10.4 10.4 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6C3.7 8.5 2 12 2 12s4 7 10 7c1.7 0 3.3-.4 4.7-1.1M9.9 9.9a3 3 0 0 0 4.2 4.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
                            )}
                          </button>
                          <button title="Детали" style={iconBtn}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </ChromeWindow>
  );
}

const iconBtn = {
  width: 26, height: 26,
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  background: 'transparent',
  border: '1px solid var(--c-line)',
  borderRadius: 6,
  color: 'var(--c-ink-500)',
  cursor: 'pointer'
};

Object.assign(window, { AdminPlayersScreen });
