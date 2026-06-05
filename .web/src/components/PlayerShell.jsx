import { Logo, Mark } from './Brand.jsx';

export function PlayerShell({ children }) {
  return (
    <main className="player-page">
      <section className="phone-shell">{children}</section>
    </main>
  );
}

export function PlayerHeader({ progress, question, remainingMs }) {
  const total = progress?.total || 0;
  const index = progress?.index || progress?.answered || 0;
  const pct = total ? (index / total) * 100 : 0;
  const elapsed = Math.max(0, (question?.timeLimitMs || 0) - remainingMs);

  return (
    <header className="player-header">
      <div className="player-header__row">
        <Logo size={19} />
        <span className="timer-pill">
          {formatClock(elapsed)} / {formatClock(question?.timeLimitMs || 0)}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="progress" style={{ flex: 1 }}>
          <span style={{ width: `${pct}%` }} />
        </div>
        <span className="num" style={{ color: 'var(--c-ink-500)', fontSize: 11, fontWeight: 800 }}>
          {String(index).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>
      </div>
    </header>
  );
}

export function CaptchaShell({ kind, title, hint, children }) {
  return (
    <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <article className="captcha">
        <div className="captcha__head">
          <div>
            <div className="eyebrow">{kind}</div>
            <h1>{title}</h1>
            {hint ? <p className="captcha__hint">{hint}</p> : null}
          </div>
          <Mark size={28} />
        </div>
        {children}
      </article>
    </div>
  );
}

export function formatClock(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
