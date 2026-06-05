/* global React, Mark, ChromeWindow, AdminSidebar, AdminTopbar, PhotoTile */
// /admin/questions — list (left) + editor (right). "With air".

function AdminQuestionsScreen() {
  const questions = [
    { id: 1,  type: 'grid3x3',   title: 'Просроченные продукты',     base: 100, time: '00:30', active: true,  draft: false },
    { id: 2,  type: 'grid3x3',   title: 'Акт за нарушение правил',   base: 100, time: '00:30', active: true,  draft: false },
    { id: 3,  type: 'grid3x3',   title: 'Утилизация из холодильника',base: 80,  time: '00:25', active: true,  draft: false },
    { id: 4,  type: 'tiles',     title: 'Чистое бельё на фото',      base: 120, time: '00:45', active: true,  draft: false },
    { id: 5,  type: 'tiles',     title: 'Парковка велосипедов',      base: 120, time: '00:45', active: false, draft: false },
    { id: 6,  type: 'slider',    title: 'Подпись в акте',             base: 150, time: '00:35', active: true,  draft: false, current: true },
    { id: 7,  type: 'slider',    title: 'Пылесос в подъезде',         base: 150, time: '00:35', active: true,  draft: false },
    { id: 8,  type: 'slider',    title: 'Ключ от коворкинга',         base: 150, time: '00:35', active: false, draft: true },
    { id: 9,  type: 'slider',    title: 'СКУД к входу в подъезд',     base: 150, time: '00:35', active: true,  draft: false },
    { id:10,  type: 'audio',     title: 'Внимание, эвакуация',        base: 120, time: '00:40', active: true,  draft: false },
    { id:11,  type: 'audio',     title: 'Выселение под пальму',       base: 120, time: '00:40', active: true,  draft: false },
    { id:12,  type: 'imageCode', title: 'Код с акта проверки',        base: 100, time: '00:20', active: true,  draft: false },
  ];

  return (
    <ChromeWindow width={1280} height={820} url="kapcha.campusfest.ru/admin/questions">
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', width: '100%', height: '100%', background: '#f6f4f0' }}>
        <AdminSidebar active="questions" />
        <main style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <AdminTopbar
            title="Вопросы"
            subtitle="12 всего · 10 активных · общий бюджет времени 5:30"
            right={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  padding: '0 14px', height: 36,
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'var(--c-purple-100)',
                  border: '1px solid rgba(129,67,135,.2)',
                  borderRadius: 999, color: 'var(--c-purple-700)',
                  font: '600 12px/1 var(--font-display)'
                }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7"/><path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
                  Бюджет: <b className="kp-num" style={{ marginLeft: 2 }}>5:30</b> / 6:00
                </div>
                <button className="kp-btn kp-btn--primary" style={{ height: 36 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2.4" strokeLinecap="round"/></svg>
                  Новый вопрос
                </button>
              </div>
            }
          />

          {/* Two-pane layout */}
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '380px 1fr', overflow: 'hidden', background: '#f6f4f0' }}>
            {/* === LIST === */}
            <div style={{
              background: '#fff',
              borderRight: '1px solid var(--c-line)',
              overflow: 'auto'
            }}>
              {/* type filters */}
              <div style={{
                display: 'flex', gap: 6, padding: '14px 16px',
                borderBottom: '1px solid var(--c-line-soft)',
                position: 'sticky', top: 0, background: '#fff', zIndex: 1
              }}>
                {[
                  { id: 'all', label: 'Все', count: 12 },
                  { id: 'grid', label: '3×3', count: 3 },
                  { id: 'tiles', label: 'Клетки', count: 2 },
                  { id: 'slider', label: 'Слайдер', count: 4 },
                  { id: 'audio', label: 'Аудио', count: 2 },
                  { id: 'code',  label: 'Код', count: 1 },
                ].map(t => (
                  <button key={t.id} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    height: 26, padding: '0 9px',
                    background: t.id === 'slider' ? 'var(--c-ink)' : 'transparent',
                    color: t.id === 'slider' ? '#fff' : 'var(--c-ink-500)',
                    border: t.id === 'slider' ? 'none' : '1px solid var(--c-line)',
                    borderRadius: 6,
                    font: '600 11.5px/1 var(--font-display)',
                    cursor: 'pointer'
                  }}>
                    {t.label}
                    <span style={{ opacity: .65, font: '600 10px/1 var(--font-mono)' }}>{t.count}</span>
                  </button>
                ))}
              </div>

              {questions.map(q => (
                <QuestionRow key={q.id} q={q} />
              ))}
            </div>

            {/* === EDITOR === */}
            <QuestionEditorSlider />
          </div>
        </main>
      </div>
    </ChromeWindow>
  );
}

function typeChip(type) {
  const map = {
    grid3x3:   { label: '3×3 фото', color: 'var(--c-purple)',     bg: 'var(--c-purple-100)' },
    tiles:     { label: 'Клетки',   color: 'var(--c-orange-700)', bg: 'var(--c-orange-100)' },
    slider:    { label: 'Слайдер',  color: '#1f1f1f',             bg: '#ebe8e2' },
    audio:     { label: 'Аудио',    color: '#2f8a4d',             bg: '#e7f4ec' },
    imageCode: { label: 'Код',      color: '#7a3a14',             bg: '#f6e0cc' }
  };
  return map[type] || map.grid3x3;
}

function QuestionRow({ q }) {
  const t = typeChip(q.type);
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '16px 1fr auto',
      gap: 10,
      alignItems: 'center',
      padding: '12px 16px',
      borderBottom: '1px solid var(--c-line-soft)',
      background: q.current ? 'var(--c-purple-50)' : 'transparent',
      borderLeft: q.current ? '3px solid var(--c-purple)' : '3px solid transparent',
      cursor: 'pointer',
      opacity: q.active ? 1 : .55
    }}>
      {/* drag handle */}
      <svg width="10" height="14" viewBox="0 0 10 14" fill="none">
        {[3, 7, 11].map(y => (
          <g key={y}>
            <circle cx="2" cy={y - 8} r="1.3" fill="var(--c-ink-300)" />
            <circle cx="8" cy={y - 8} r="1.3" fill="var(--c-ink-300)" />
          </g>
        ))}
      </svg>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span style={{
            height: 18, padding: '0 6px',
            background: t.bg, color: t.color,
            font: '600 10px/1 var(--font-display)',
            letterSpacing: '.04em',
            borderRadius: 4,
            display: 'inline-flex', alignItems: 'center',
            textTransform: 'uppercase'
          }}>{t.label}</span>
          <span className="kp-num" style={{ font: '500 10.5px/1 var(--font-mono)', color: 'var(--c-ink-400)' }}>
            #{String(q.id).padStart(2,'0')}
          </span>
          {q.draft && (
            <span style={{ font: '600 9.5px/1 var(--font-display)', color: 'var(--warn,#d99211)', letterSpacing: '.06em', textTransform: 'uppercase' }}>черновик</span>
          )}
        </div>
        <div style={{
          font: '600 13.5px/1.2 var(--font-display)',
          color: 'var(--c-ink)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
        }}>{q.title}</div>
        <div style={{
          display: 'flex', gap: 10, marginTop: 4,
          font: '500 11px/1 var(--font-display)', color: 'var(--c-ink-500)'
        }}>
          <span className="kp-num">⏱ {q.time}</span>
          <span className="kp-num">★ {q.base}</span>
        </div>
      </div>
      {/* toggle */}
      <div style={{
        width: 32, height: 18, borderRadius: 999,
        background: q.active ? 'var(--c-ink)' : 'var(--c-line)',
        position: 'relative', transition: 'background .15s'
      }}>
        <div style={{
          position: 'absolute', top: 2,
          left: q.active ? 16 : 2,
          width: 14, height: 14, borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 1px 2px rgba(0,0,0,.18)',
          transition: 'left .15s'
        }} />
      </div>
    </div>
  );
}

// === The slider editor (priority type) =================================

function QuestionEditorSlider() {
  return (
    <div style={{ overflow: 'auto', padding: '28px 36px 36px' }}>
      {/* breadcrumbs / heading */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, font: '500 12px/1 var(--font-display)', color: 'var(--c-ink-500)', marginBottom: 10 }}>
        <span>Слайдер</span>
        <span>·</span>
        <span className="kp-num">#06</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
        <div>
          <input
            defaultValue="Поставьте подпись в акте"
            style={{
              width: 520,
              border: 0, outline: 'none', background: 'transparent',
              font: '700 28px/1.1 var(--font-display)',
              letterSpacing: '-.025em',
              color: 'var(--c-ink)',
              padding: 0
            }}
          />
          <div style={{ font: '500 13px/1.4 var(--font-display)', color: 'var(--c-ink-500)', marginTop: 6, maxWidth: 540 }}>
            Игрок перетаскивает объект на фон. Правильно — если конечная точка не дальше&nbsp;<i>tolerance</i> от цели.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="kp-btn kp-btn--ghost" style={{ height: 36 }}>Превью</button>
          <button className="kp-btn kp-btn--ghost" style={{ height: 36 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button className="kp-btn kp-btn--solid" style={{ height: 36 }}>Сохранить</button>
        </div>
      </div>

      {/* Grid: stage left, params right */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
        {/* STAGE */}
        <div className="kp-card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div className="kp-eyebrow">Холст вопроса</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button style={iconBtnAdmin} title="Открыть в полный экран">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M3 3h6M3 3v6M21 3h-6M21 3v6M3 21h6M3 21v-6M21 21h-6M21 21v-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
              </button>
              <button style={iconBtnAdmin} title="Заменить фон">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" stroke="currentColor" strokeWidth="1.7" rx="2"/><circle cx="8.5" cy="10.5" r="1.5" fill="currentColor"/><path d="M21 16l-5-5-9 9" stroke="currentColor" strokeWidth="1.7"/></svg>
              </button>
            </div>
          </div>
          {/* The interactive stage — a "photo" with target marker and object */}
          <div style={{
            position: 'relative', borderRadius: 10, overflow: 'hidden',
            aspectRatio: '16 / 10',
            background: 'linear-gradient(180deg,#3c3128 0%,#5a4733 55%,#37291f 100%)'
          }}>
            {/* hallway lines */}
            <svg viewBox="0 0 400 250" preserveAspectRatio="none"
                 style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
              <rect x="0" y="0" width="400" height="120" fill="#2c2118" />
              <rect x="0" y="120" width="400" height="130" fill="#4a3829" />
              <line x1="0" y1="250" x2="200" y2="120" stroke="rgba(255,255,255,.08)"/>
              <line x1="400" y1="250" x2="200" y2="120" stroke="rgba(255,255,255,.08)"/>
              <line x1="80" y1="250" x2="200" y2="120" stroke="rgba(255,255,255,.05)"/>
              <line x1="320" y1="250" x2="200" y2="120" stroke="rgba(255,255,255,.05)"/>
              <line x1="0" y1="121" x2="400" y2="121" stroke="rgba(255,255,255,.15)"/>
              {/* paper on a desk */}
              <rect x="60" y="165" width="90" height="55" fill="#ece5d5" transform="rotate(-3 105 192)" />
              <line x1="70" y1="180" x2="135" y2="180" stroke="rgba(0,0,0,.25)" strokeWidth="1" transform="rotate(-3 105 192)"/>
              <line x1="70" y1="190" x2="125" y2="190" stroke="rgba(0,0,0,.25)" strokeWidth="1" transform="rotate(-3 105 192)"/>
              <line x1="70" y1="200" x2="115" y2="200" stroke="rgba(0,0,0,.25)" strokeWidth="1" transform="rotate(-3 105 192)"/>
              <line x1="70" y1="210" x2="100" y2="210" stroke="rgba(0,0,0,.4)" strokeWidth="2" transform="rotate(-3 105 192)"/>
            </svg>

            {/* TARGET marker (admin-only crosshair + tolerance ring) */}
            <div style={{
              position: 'absolute',
              left: '24%', top: '78%',
              transform: 'translate(-50%,-50%)'
            }}>
              <div style={{
                width: 110, height: 110, borderRadius: '50%',
                border: '1.5px dashed rgba(231,123,46,.85)',
                background: 'rgba(231,123,46,.10)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'var(--c-orange)', boxShadow: '0 0 0 4px rgba(231,123,46,.25)' }} />
              </div>
              <div style={{
                position: 'absolute', left: '50%', top: -22, transform: 'translateX(-50%)',
                background: 'var(--c-orange)', color: '#fff',
                font: '600 10px/1 var(--font-mono)',
                padding: '4px 6px', borderRadius: 4,
                whiteSpace: 'nowrap'
              }}>x 0.24 · y 0.78</div>
            </div>

            {/* OBJECT thumbnail in upper-right (the thing player drags) */}
            <div style={{
              position: 'absolute', right: 12, top: 12,
              padding: 6, background: 'rgba(0,0,0,.55)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,.2)',
              borderRadius: 8,
              display: 'flex', alignItems: 'center', gap: 8,
              color: '#fff', font: '600 11px/1.2 var(--font-display)'
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 6,
                background: 'var(--c-orange-100)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 12V8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v4M4 14v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M12 6v0M16 18h-8" stroke="#E77B2E" strokeWidth="1.7" strokeLinecap="round"/></svg>
              </div>
              <div>
                <div>object.png</div>
                <div style={{ opacity: .7, font: '500 10px/1 var(--font-mono)', marginTop: 2 }}>284 × 376</div>
              </div>
            </div>

            {/* hint */}
            <div style={{
              position: 'absolute', left: 12, bottom: 12,
              background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(6px)',
              color: '#fff', font: '500 11px/1.3 var(--font-display)',
              padding: '6px 9px', borderRadius: 6,
              display: 'flex', alignItems: 'center', gap: 6
            }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6z" stroke="#fff" strokeWidth="1.5"/></svg>
              Кликните по фону, чтобы поставить цель
            </div>
          </div>

          {/* normalized coord readout */}
          <div style={{ display: 'flex', gap: 16, marginTop: 14, font: '500 12px/1.3 var(--font-display)', color: 'var(--c-ink-500)' }}>
            <div>Фон: <code style={{ font: '500 11.5px/1 var(--font-mono)' }}>bg-empty-podezd.jpg · 1600×1000</code></div>
            <div>Цель: <code style={{ font: '500 11.5px/1 var(--font-mono)' }}>x=0.24, y=0.78</code></div>
            <div>Tolerance: <code style={{ font: '500 11.5px/1 var(--font-mono)' }}>0.06</code></div>
          </div>
        </div>

        {/* PARAMS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Settings card */}
          <div className="kp-card" style={{ padding: 18 }}>
            <div className="kp-eyebrow" style={{ marginBottom: 12 }}>Параметры</div>

            <Field label="Базовые очки" hint="ставка за моментальный правильный ответ">
              <NumberStepper value={150} />
            </Field>

            <Field label="Лимит времени" hint="за это время — 0.2× ставки">
              <TimeInput value="00:35" />
            </Field>

            <Field label="Ось привязки">
              <Segmented value="both" options={[
                { id: 'x', label: 'X' },
                { id: 'y', label: 'Y' },
                { id: 'both', label: 'Обе' }
              ]} />
            </Field>

            <Field label="Tolerance" hint="допустимое расстояние, 0–0.5">
              <Slider value={0.06} />
            </Field>
          </div>

          {/* State card */}
          <div className="kp-card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ font: '600 13px/1.2 var(--font-display)' }}>Активен в игре</div>
                <div style={{ font: '500 11.5px/1.4 var(--font-display)', color: 'var(--c-ink-500)', marginTop: 2 }}>
                  Войдёт в следующую сессию
                </div>
              </div>
              <div style={{
                width: 38, height: 22, borderRadius: 999, background: 'var(--c-ink)',
                position: 'relative'
              }}>
                <div style={{ position: 'absolute', top: 2, left: 18, width: 18, height: 18, borderRadius: '50%', background: '#fff' }} />
              </div>
            </div>
          </div>

          {/* meta */}
          <div style={{
            font: '500 11px/1.4 var(--font-display)', color: 'var(--c-ink-400)',
            paddingTop: 4
          }}>
            Обновлено <b className="kp-num">02.06.2026 в 13:42</b>
          </div>
        </div>
      </div>
    </div>
  );
}

const iconBtnAdmin = {
  width: 28, height: 28,
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  background: '#fff',
  border: '1px solid var(--c-line)',
  borderRadius: 6,
  color: 'var(--c-ink-500)',
  cursor: 'pointer'
};

// === Field controls ====================================================

function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <span style={{ font: '600 12px/1 var(--font-display)', color: 'var(--c-ink-700)' }}>{label}</span>
        {hint && <span style={{ font: '500 10.5px/1.2 var(--font-display)', color: 'var(--c-ink-400)' }}>{hint}</span>}
      </label>
      {children}
    </div>
  );
}

function NumberStepper({ value }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      border: '1.5px solid var(--c-line)', borderRadius: 8,
      background: '#fff', overflow: 'hidden', height: 36
    }}>
      <button style={stepperBtn}>−</button>
      <input className="kp-num" defaultValue={value} style={{
        flex: 1, border: 0, outline: 'none',
        textAlign: 'center',
        font: '700 16px/1 var(--font-mono)', color: 'var(--c-ink)'
      }} />
      <button style={stepperBtn}>+</button>
    </div>
  );
}
function TimeInput({ value }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      height: 36, padding: '0 12px',
      border: '1.5px solid var(--c-line)', borderRadius: 8, background: '#fff'
    }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="var(--c-ink-500)" strokeWidth="1.6"/><path d="M12 7v5l3 3" stroke="var(--c-ink-500)" strokeWidth="1.6" strokeLinecap="round"/></svg>
      <input defaultValue={value} className="kp-num" style={{
        flex: 1, border: 0, outline: 'none',
        font: '700 15px/1 var(--font-mono)'
      }}/>
      <span style={{ font: '500 11px/1 var(--font-display)', color: 'var(--c-ink-400)' }}>мм:сс</span>
    </div>
  );
}
const stepperBtn = {
  width: 36, height: '100%',
  border: 0, background: 'transparent',
  font: '700 18px/1 var(--font-display)',
  color: 'var(--c-ink-500)', cursor: 'pointer'
};

function Segmented({ value, options }) {
  return (
    <div style={{
      display: 'inline-flex', padding: 3,
      background: 'var(--c-line-soft)', borderRadius: 8
    }}>
      {options.map(o => (
        <button key={o.id} style={{
          height: 28, padding: '0 14px', border: 0, cursor: 'pointer',
          borderRadius: 6,
          background: o.id === value ? '#fff' : 'transparent',
          color: o.id === value ? 'var(--c-ink)' : 'var(--c-ink-500)',
          font: `${o.id === value ? '600' : '500'} 12px/1 var(--font-display)`,
          boxShadow: o.id === value ? '0 1px 2px rgba(0,0,0,.06)' : 'none'
        }}>{o.label}</button>
      ))}
    </div>
  );
}
function Slider({ value }) {
  const pct = (value / 0.5) * 100;
  return (
    <div style={{ position: 'relative', height: 36, display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ position: 'relative', flex: 1, height: 6, background: 'var(--c-line)', borderRadius: 999 }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: 'var(--c-ink)', borderRadius: 999 }}/>
        <div style={{
          position: 'absolute', left: `calc(${pct}% - 9px)`, top: -6,
          width: 18, height: 18, borderRadius: '50%',
          background: '#fff', border: '2px solid var(--c-ink)',
          boxShadow: '0 1px 2px rgba(0,0,0,.1)'
        }}/>
      </div>
      <div className="kp-num" style={{
        width: 52, height: 30,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--c-line-soft)',
        font: '700 13px/1 var(--font-mono)',
        borderRadius: 6
      }}>{value.toFixed(2)}</div>
    </div>
  );
}

Object.assign(window, { AdminQuestionsScreen });
