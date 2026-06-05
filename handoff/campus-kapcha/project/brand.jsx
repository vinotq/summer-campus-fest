/* global React */
// Brand atoms — logo lockups + the 8-point mark used as a brand graphic.
// Mark is loaded from brand/mark.svg via CSS mask in styles.css (.kp-mark).
// This file exposes pure-SVG/JSX variants too so the mark can be filled
// with a gradient stroke or used as a decorative background pattern.

const KP_GRADIENT_ID = 'kpGrad';

function GradientDef({ id = KP_GRADIENT_ID, from = '#E77B2E', to = '#814387' }) {
  return (
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor={from} />
        <stop offset="100%" stopColor={to} />
      </linearGradient>
    </defs>
  );
}

// Brand mark — 8-point sparkle. Use as a small badge.
function Mark({ size = 24, fill = 'gradient', style }) {
  const useGradient = fill === 'gradient';
  const id = `kp-mark-${React.useId()}`;
  const fillVal = useGradient ? `url(#${id})` : fill;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 315 300"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
      aria-hidden="true"
    >
      {useGradient && (
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#E77B2E" />
            <stop offset="100%" stopColor="#814387" />
          </linearGradient>
        </defs>
      )}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        fill={fillVal}
        d="M189.063 8.748C178.539 13.486 167.668 18.38 156.556 18.38C145.772 18.38 133.587 13.769 121.422 9.166C103.663 2.446 85.947-4.258 72.702 3.431C59.843 10.815 59.789 27.425 59.734 44.451C59.693 57.298 59.651 70.381 54.106 79.917C49.356 87.933 40.97 96.732 32.198 105.937C16.702 122.197 0 139.723 0 156.427C0 172.894 12.202 185.066 24.522 197.356C31.774 204.591 39.067 211.866 43.937 220.083C48.573 227.905 52.2 238.116 55.933 248.625C62.782 267.903 69.987 288.183 84.43 296.569C97.398 304.097 111.331 297.825 125.934 291.251C136.458 286.514 147.331 281.619 158.443 281.619C169.227 281.619 181.413 286.23 193.578 290.835C211.337 297.555 229.052 304.257 242.297 296.569C255.156 289.185 255.21 272.574 255.265 255.548C255.306 242.702 255.349 229.619 260.894 220.083C266.154 211.206 275.873 203.428 285.638 195.611C300.268 183.904 315 172.116 315 156.427C315 138.323 300.252 119.254 286.812 101.877C280.83 94.144 275.109 86.746 271.062 79.917C266.426 72.094 262.799 61.884 259.065 51.375C252.217 32.097 245.012 11.816 230.57 3.431C217.6-4.098 203.667 2.174 189.063 8.748ZM168.859 112.061C168.219 112.913 166.863 112.551 166.737 111.495L158.655 43.676C158.49 42.290 156.471 42.290 156.306 43.676L148.267 111.14C148.141 112.197 146.784 112.559 146.145 111.706L105.286 57.257C104.448 56.139 102.699 57.145 103.252 58.427L130.258 121.064C130.679 122.041 129.687 123.031 128.704 122.611L65.804 95.725C64.516 95.175 63.507 96.916 64.629 97.751L119.536 138.6C120.391 139.237 120.028 140.588 118.967 140.713L50.760 148.772C49.369 148.936 49.369 150.947 50.760 151.111L118.792 159.148C119.853 159.274 120.216 160.625 119.360 161.262L64.620 201.988C63.497 202.823 64.506 204.565 65.794 204.015L128.719 177.117C129.700 176.697 130.693 177.687 130.272 178.665L103.262 241.313C102.709 242.595 104.457 243.6 105.296 242.482L146.131 188.064C146.771 187.212 148.127 187.574 148.253 188.630L156.306 256.323C156.471 257.709 158.490 257.709 158.655 256.323L166.690 188.851C166.816 187.795 168.172 187.434 168.811 188.286L209.738 242.788C210.575 243.901 212.318 242.898 211.770 241.618L184.700 178.405C184.282 177.428 185.273 176.439 186.254 176.857L249.157 203.685C250.448 204.236 251.456 202.49 250.330 201.656L195.466 161.04C194.611 160.406 194.971 159.061 196.027 158.928L264.205 150.314C265.595 150.138 265.583 148.130 264.190 147.974L196.227 140.353C195.167 140.234 194.798 138.886 195.651 138.247L250.336 97.292C251.456 96.453 250.448 94.717 249.158 95.270L186.246 122.222C185.265 122.642 184.273 121.652 184.694 120.674L211.751 57.821C212.301 56.541 210.561 55.535 209.722 56.648L168.859 112.061Z"
      />
    </svg>
  );
}

// Compact horizontal logo: mark + wordmark in Onest
function Logo({ size = 28, dark = false }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <Mark size={size} />
      <span style={{
        font: `700 ${Math.round(size * 0.7)}px/1 'Onest', sans-serif`,
        letterSpacing: '-.02em',
        color: dark ? '#fff' : '#1f1f1f'
      }}>
        Сириус<span style={{ color: dark ? '#E77B2E' : '#814387' }}>.</span>Капча
      </span>
    </span>
  );
}

// Decorative "stamp" pattern of marks — faint background art
function MarkField({ count = 28, opacity = 0.08, color = '#814387', style }) {
  // deterministic pseudo-random positions
  const rng = (i) => {
    const x = Math.sin(i * 9301 + 49297) * 233280;
    return x - Math.floor(x);
  };
  const items = Array.from({ length: count }, (_, i) => {
    const x = rng(i * 2) * 100;
    const y = rng(i * 2 + 1) * 100;
    const s = 14 + rng(i * 3) * 36;
    const r = (rng(i * 5) - 0.5) * 60;
    return { x, y, s, r, key: i };
  });
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', ...style }}>
      {items.map(it => (
        <Mark
          key={it.key}
          size={it.s}
          fill={color}
          style={{
            position: 'absolute',
            left: `${it.x}%`,
            top: `${it.y}%`,
            transform: `translate(-50%,-50%) rotate(${it.r}deg)`,
            opacity
          }}
        />
      ))}
    </div>
  );
}

Object.assign(window, { Mark, Logo, MarkField, GradientDef, KP_GRADIENT_ID });
