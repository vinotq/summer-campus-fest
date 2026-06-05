export function Mark({ size = 28, className = '', style }) {
  return <span aria-hidden className={`brand-mark ${className}`} style={{ fontSize: size, ...style }} />;
}

export function Logo({ size = 20, light = false }) {
  return (
    <span className={`brand-logo ${light ? 'brand-logo--light' : ''}`} style={{ fontSize: size }}>
      <Mark size={size} />
      <span>Сириус.Капча</span>
    </span>
  );
}

export function MarkField({ count = 18, opacity = 0.12 }) {
  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {Array.from({ length: count }, (_, index) => {
        const size = 22 + ((index * 17) % 76);
        const left = `${(index * 37) % 104}%`;
        const top = `${(index * 23) % 96}%`;
        return (
          <Mark
            key={index}
            size={size}
            style={{
              position: 'absolute',
              left,
              top,
              opacity,
              background: '#fff',
              transform: `rotate(${index * 18}deg)`,
            }}
          />
        );
      })}
    </div>
  );
}
