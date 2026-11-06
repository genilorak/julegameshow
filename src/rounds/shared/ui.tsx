// Små byggeklosser som går igjen i flere runder.
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import type { Contestant } from '../../core/types';
import { Emo } from '../../design/Emo';

export function Pills({ items }: { items: Array<string | false | null | undefined> }) {
  return (
    <div className="quiz-meta">
      {items.filter(Boolean).map((t, i) => (
        <span key={i} className="pill">
          {t}
        </span>
      ))}
    </div>
  );
}

/** «Det er din tur»-skilt med stor emoji og navn. */
export function TurnBadge({ c, label = 'Sin tur', size = 'md' }: { c: Contestant | undefined; label?: string; size?: 'md' | 'lg' }) {
  if (!c) return null;
  return (
    <motion.div className={`turn-badge ${size}`} style={{ ['--c' as string]: c.color }} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 16 }}>
      <span className="e">{c.emoji}</span>
      <span className="n">{c.name}</span>
      {label && <span className="l">{label}</span>}
    </motion.div>
  );
}

/** Stor gyllen avsløring av et svar. */
export function BigReveal({ kicker, children, sub }: { kicker?: string; children: ReactNode; sub?: ReactNode }) {
  return (
    <motion.div className="big-reveal" initial={{ opacity: 0, scale: 0.4, rotateX: 80 }} animate={{ opacity: 1, scale: 1, rotateX: 0 }} transition={{ type: 'spring', stiffness: 120, damping: 13 }}>
      <div className="big-reveal-rays" />
      {kicker && <p className="kicker">{kicker}</p>}
      <h1 className="display">{typeof children === 'string' ? <Emo text={children} /> : children}</h1>
      {sub && <p className="subtitle">{sub}</p>}
    </motion.div>
  );
}

/** Velg én deltaker (programlederkontroller). */
export function PickContestant({
  contestants,
  selected,
  onPick,
  label,
  disabled,
}: {
  contestants: Contestant[];
  selected?: string | null;
  onPick: (id: string) => void;
  label?: string;
  disabled?: (c: Contestant) => boolean;
}) {
  return (
    <div>
      {label && <span className="hp-label">{label}</span>}
      <div className="hp-chips">
        {contestants.map((c) => (
          <button key={c.id} className={`hp-chip ${selected === c.id ? 'on' : ''}`} style={{ ['--c' as string]: c.color }} onClick={() => onPick(c.id)} disabled={disabled?.(c)}>
            {c.emoji} {c.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Answer({ show, label = 'Fasit', children }: { show: boolean; label?: string; children: ReactNode }) {
  if (!show) return <p className="hp-note">Fasit er skjult her. Den vises for alle når du avslører.</p>;
  return (
    <div className="hp-answer">
      <span className="hp-label">{label}</span>
      <strong>{children}</strong>
    </div>
  );
}
