import { useMemo, useRef, useState } from 'react';
import { Check, Grip, ImageOff, Pause, Play, RotateCcw } from 'lucide-react';
import { CaptchaShell } from './PlayerShell.jsx';

export function QuestionRenderer({ question, disabled, onSubmit }) {
  if (!question) return null;
  const common = { question, disabled, onSubmit };

  if (question.type === 'grid3x3') return <GridQuestion {...common} />;
  if (question.type === 'tiles') return <TilesQuestion {...common} />;
  if (question.type === 'slider') return <SliderQuestion {...common} />;
  if (question.type === 'audio') return <AudioQuestion {...common} />;
  if (question.type === 'imageCode') return <ImageCodeQuestion {...common} />;

  return (
    <CaptchaShell kind="НЕИЗВЕСТНЫЙ ТИП" title={question.title}>
      <div className="empty-state">Фронтенд пока не знает, как показать `{question.type}`.</div>
    </CaptchaShell>
  );
}

function GridQuestion({ question, disabled, onSubmit }) {
  const tiles = question.publicView?.tiles || [];
  const [selected, setSelected] = useState([]);
  const toggle = (index) => {
    setSelected((current) => (
      current.includes(index) ? current.filter((item) => item !== index) : [...current, index].sort((a, b) => a - b)
    ));
  };

  return (
    <>
      <CaptchaShell
        kind="ВЫБЕРИТЕ ВСЕ ПОДХОДЯЩИЕ"
        title={question.title}
        hint="Нажмите на все изображения, которые подходят под условие."
      >
        <div style={{ padding: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {tiles.map((tile, index) => (
              <PhotoButton
                key={tile.index ?? index}
                src={tile.assetUrl}
                active={selected.includes(tile.index ?? index)}
                label={`Фото ${index + 1}`}
                onClick={() => toggle(tile.index ?? index)}
              />
            ))}
          </div>
          <div style={{ marginTop: 12, color: 'var(--c-ink-500)', fontSize: 12, fontWeight: 600 }}>
            Выбрано: <b style={{ color: 'var(--c-ink)' }}>{selected.length}</b>
          </div>
        </div>
      </CaptchaShell>
      <SubmitBar disabled={disabled} onClick={() => onSubmit({ selected })} />
    </>
  );
}

function TilesQuestion({ question, disabled, onSubmit }) {
  const { assetUrl, grid = { cols: 4, rows: 4 } } = question.publicView || {};
  const [selected, setSelected] = useState([]);
  const cells = grid.cols * grid.rows;
  const toggle = (index) => {
    setSelected((current) => (
      current.includes(index) ? current.filter((item) => item !== index) : [...current, index].sort((a, b) => a - b)
    ));
  };

  return (
    <>
      <CaptchaShell
        kind="ВЫБЕРИТЕ КЛЕТКИ"
        title={question.title}
        hint={`${grid.cols}×${grid.rows}. Нажмите на все нужные области изображения.`}
      >
        <div style={{ padding: 12 }}>
          <div className="photo-stage" style={{ position: 'relative', overflow: 'hidden', borderRadius: 10, aspectRatio: '1 / 1' }}>
            <AssetImage src={assetUrl} alt="" />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'grid',
                gridTemplateColumns: `repeat(${grid.cols}, 1fr)`,
                gridTemplateRows: `repeat(${grid.rows}, 1fr)`,
              }}
            >
              {Array.from({ length: cells }, (_, index) => (
                <button
                  key={index}
                  type="button"
                  aria-label={`Клетка ${index + 1}`}
                  onClick={() => toggle(index)}
                  style={{
                    border: '1px solid rgba(255,255,255,.62)',
                    background: selected.includes(index) ? 'rgba(129,67,135,.42)' : 'rgba(0,0,0,.04)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {selected.includes(index) ? <Check size={18} strokeWidth={3} /> : null}
                </button>
              ))}
            </div>
          </div>
        </div>
      </CaptchaShell>
      <SubmitBar disabled={disabled} onClick={() => onSubmit({ selected })} />
    </>
  );
}

function SliderQuestion({ question, disabled, onSubmit }) {
  const { backgroundUrl, objectUrl, axis = 'both' } = question.publicView || {};
  const stageRef = useRef(null);
  const [point, setPoint] = useState({ x: 0.5, y: 0.5 });

  const updateFromPointer = (event) => {
    const rect = stageRef.current.getBoundingClientRect();
    const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
    setPoint((current) => ({
      x: axis === 'y' ? current.x : x,
      y: axis === 'x' ? current.y : y,
    }));
  };

  return (
    <>
      <CaptchaShell
        kind="ПОТАЩИТЕ ОБЪЕКТ"
        title={question.title}
        hint={axis === 'both' ? 'Поставьте объект в правильную точку.' : `Двигайте только по оси ${axis.toUpperCase()}.`}
      >
        <div style={{ padding: 12 }}>
          <div
            ref={stageRef}
            role="button"
            tabIndex={0}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              updateFromPointer(event);
            }}
            onPointerMove={(event) => {
              if (event.buttons) updateFromPointer(event);
            }}
            style={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 10,
              aspectRatio: '4 / 5',
              background: 'linear-gradient(180deg,#3c3128 0%,#5a4733 55%,#37291f 100%)',
              touchAction: 'none',
            }}
          >
            <AssetImage src={backgroundUrl} alt="" />
            <div
              style={{
                position: 'absolute',
                left: `${point.x * 100}%`,
                top: `${point.y * 100}%`,
                transform: 'translate(-50%, -50%)',
                width: 74,
                height: 74,
                borderRadius: 16,
                background: objectUrl ? 'rgba(255,255,255,.94)' : 'var(--grad)',
                boxShadow: '0 10px 24px rgba(0,0,0,.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 8,
              }}
            >
              {objectUrl ? <img src={objectUrl} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /> : <Grip color="#fff" />}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
            {[
              ['X', point.x],
              ['Y', point.y],
            ].map(([label, value]) => (
              <div key={label} style={{ flex: 1 }}>
                <div className="num" style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--c-ink-500)', fontSize: 11, fontWeight: 800 }}>
                  <span>{label}</span>
                  <span>{value.toFixed(2)}</span>
                </div>
                <div className="progress" style={{ marginTop: 5 }}>
                  <span style={{ width: `${value * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CaptchaShell>
      <SubmitBar disabled={disabled} label="Поставить здесь" onClick={() => onSubmit(point)} />
    </>
  );
}

function AudioQuestion({ question, disabled, onSubmit }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [text, setText] = useState('');
  const bars = useMemo(() => Array.from({ length: 42 }, (_, index) => 18 + Math.abs(Math.sin(index * 1.7)) * 48), []);

  return (
    <>
      <CaptchaShell
        kind="АУДИО · ТРАНСКРИБИРУЙТЕ"
        title={question.title}
        hint="Перепишите ровно так, как звучит. Запятые и регистр обычно не важны."
      >
        <div style={{ padding: 16, display: 'grid', gap: 14 }}>
          <div style={{ borderRadius: 14, padding: 16, color: '#fff', background: 'linear-gradient(135deg,#2a2026 0%,#1d1d2a 100%)' }}>
            <audio ref={audioRef} src={question.publicView?.audioUrl} onEnded={() => setPlaying(false)} preload="metadata" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                className="btn btn--ghost btn--icon"
                type="button"
                onClick={() => {
                  const audio = audioRef.current;
                  if (!audio) return;
                  if (audio.paused) {
                    audio.play();
                    setPlaying(true);
                  } else {
                    audio.pause();
                    setPlaying(false);
                  }
                }}
              >
                {playing ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <button
                className="btn btn--ghost btn--icon"
                type="button"
                onClick={() => {
                  const audio = audioRef.current;
                  if (!audio) return;
                  audio.currentTime = 0;
                  audio.play();
                  setPlaying(true);
                }}
              >
                <RotateCcw size={15} />
              </button>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2, height: 48 }}>
                {bars.map((height, index) => (
                  <span
                    key={index}
                    style={{ width: 4, height, borderRadius: 4, background: index % 3 ? 'rgba(255,255,255,.28)' : 'var(--c-orange)' }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="label" htmlFor="audio-answer">Ваш вариант</label>
            <input id="audio-answer" className="field" value={text} onChange={(event) => setText(event.target.value)} placeholder="Введите услышанную фразу" />
          </div>
        </div>
      </CaptchaShell>
      <SubmitBar disabled={disabled || !text.trim()} onClick={() => onSubmit({ text })} />
    </>
  );
}

function ImageCodeQuestion({ question, disabled, onSubmit }) {
  const [text, setText] = useState('');
  return (
    <>
      <CaptchaShell kind="КОД С КАРТИНКИ" title={question.title} hint="Введите символы с изображения.">
        <div style={{ padding: 16, display: 'grid', gap: 14 }}>
          <div style={{ minHeight: 150, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--c-line)', background: 'var(--c-line-soft)' }}>
            <AssetImage src={question.publicView?.assetUrl} alt="Код с картинки" contain />
          </div>
          <div>
            <label className="label" htmlFor="image-code-answer">Код</label>
            <input id="image-code-answer" className="field" value={text} onChange={(event) => setText(event.target.value)} placeholder="Например K7Q9" />
          </div>
        </div>
      </CaptchaShell>
      <SubmitBar disabled={disabled || !text.trim()} onClick={() => onSubmit({ text })} />
    </>
  );
}

function PhotoButton({ src, active, label, onClick }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      style={{
        position: 'relative',
        aspectRatio: '1',
        overflow: 'hidden',
        border: 0,
        borderRadius: 8,
        padding: 0,
        background: 'var(--c-line-soft)',
      }}
    >
      <AssetImage src={src} alt={label} />
      {active ? (
        <>
          <span style={{ position: 'absolute', inset: 0, borderRadius: 8, boxShadow: 'inset 0 0 0 3px #fff, inset 0 0 0 6px var(--c-purple)' }} />
          <span style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: '50%', background: 'var(--c-purple)', display: 'grid', placeItems: 'center', color: '#fff' }}>
            <Check size={14} strokeWidth={3} />
          </span>
        </>
      ) : null}
    </button>
  );
}

function AssetImage({ src, alt, contain = false }) {
  if (!src) {
    return (
      <div style={{ width: '100%', height: '100%', minHeight: 120, display: 'grid', placeItems: 'center', color: 'var(--c-ink-400)' }}>
        <ImageOff size={26} />
      </div>
    );
  }
  return <img src={src} alt={alt} style={{ width: '100%', height: '100%', display: 'block', objectFit: contain ? 'contain' : 'cover' }} />;
}

function SubmitBar({ disabled, label = 'Подтвердить', onClick }) {
  return (
    <div className="bottom-bar">
      <button className="btn btn--primary" type="button" disabled={disabled} onClick={onClick} style={{ width: '100%', minHeight: 52 }}>
        {label}
      </button>
    </div>
  );
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
