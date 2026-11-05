import { memo } from 'react';

// Faste posisjoner (ikke tilfeldige), så TV og programlederforhåndsvisning ser like ut.
const BOKEH = [
  [140, 210, 70, '#e7bf5f'], [330, 120, 40, '#c9343f'], [520, 260, 26, '#f3d98c'], [1450, 150, 56, '#e7bf5f'],
  [1660, 260, 34, '#c9343f'], [1800, 120, 22, '#f3d98c'], [90, 620, 30, '#2f7a55'], [1820, 640, 44, '#2f7a55'],
  [260, 880, 60, '#e7bf5f'], [1640, 900, 66, '#e7bf5f'], [760, 90, 18, '#f3d98c'], [1180, 70, 24, '#c9343f'],
  [980, 160, 14, '#f3d98c'], [60, 380, 20, '#f3d98c'], [1880, 420, 18, '#e7bf5f'], [420, 980, 24, '#c9343f'],
  [1500, 1010, 28, '#c9343f'], [1240, 980, 16, '#f3d98c'],
] as const;

// En lyslenke som henger i en bue over toppen av scenen.
const BULBS = Array.from({ length: 34 }, (_, i) => {
  const t = i / 33;
  const x = t * 1960 - 20;
  const y = 18 + Math.sin(t * Math.PI * 6) * 14 + Math.sin(t * Math.PI) * 30;
  const colors = ['#f3d98c', '#c9343f', '#5fcf8f', '#f3d98c', '#e7bf5f'];
  return { x, y, c: colors[i % colors.length], d: (i % 7) * 0.45 };
});

export const Backdrop = memo(function Backdrop() {
  return (
    <div className="backdrop" aria-hidden>
      <div className="backdrop-base" />
      <div className="beam b1" />
      <div className="beam b2" />
      <div className="beam b3" />
      <div className="backdrop-floor" />
      {BOKEH.map(([x, y, s, c], i) => (
        <span
          key={i}
          className="bokeh"
          style={{
            left: x,
            top: y,
            width: s,
            height: s,
            background: `radial-gradient(circle, ${c} 0%, transparent 70%)`,
            ['--dur' as string]: `${5 + (i % 5)}s`,
            ['--delay' as string]: `${-(i * 0.7)}s`,
          }}
        />
      ))}
      <svg className="lights-string" viewBox="0 0 1920 90" preserveAspectRatio="none">
        <path
          d={`M ${BULBS.map((b) => `${b.x} ${b.y - 6}`).join(' L ')}`}
          fill="none"
          stroke="rgba(0,0,0,0.6)"
          strokeWidth="2"
        />
        {BULBS.map((b, i) => (
          <g key={i}>
            <circle cx={b.x} cy={b.y + 4} r="16" fill={b.c} opacity="0.18">
              <animate attributeName="opacity" values="0.08;0.3;0.08" dur="3.2s" begin={`${b.d}s`} repeatCount="indefinite" />
            </circle>
            <ellipse cx={b.x} cy={b.y + 4} rx="5" ry="8" fill={b.c} />
          </g>
        ))}
      </svg>
      <div className="vignette" />
    </div>
  );
});
