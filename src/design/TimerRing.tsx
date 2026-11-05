import { useTimeLeft } from '../core/useNow';
import type { TimerState } from '../core/types';

/** Stor nedtelling. Blir rød de siste fem sekundene. */
export function TimerRing({ timer, size = 220, style }: { timer: TimerState; size?: number; style?: React.CSSProperties }) {
  const left = useTimeLeft(timer);
  if (!timer.durationMs) return null;
  const secs = Math.ceil(left / 1000);
  const frac = timer.durationMs ? left / timer.durationMs : 0;
  const r = 90;
  const c = 2 * Math.PI * r;
  const urgent = secs <= 5;
  return (
    <svg className="timer-ring" width={size} height={size} viewBox="0 0 220 220" style={style} aria-label={`${secs} sekunder igjen`}>
      <circle cx="110" cy="110" r="104" fill="rgba(3,8,6,0.75)" />
      <circle cx="110" cy="110" r={r} fill="none" stroke="rgba(247,240,225,0.12)" strokeWidth="12" />
      <circle
        cx="110"
        cy="110"
        r={r}
        fill="none"
        stroke={urgent ? '#ff6b6b' : '#e7bf5f'}
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - frac)}
        transform="rotate(-90 110 110)"
        style={{ transition: 'stroke-dashoffset 0.1s linear, stroke 0.3s', filter: `drop-shadow(0 0 12px ${urgent ? '#ff6b6b' : '#e7bf5f'})` }}
      />
      <text x="110" y="132" textAnchor="middle" fontSize="72">
        {secs}
      </text>
    </svg>
  );
}
