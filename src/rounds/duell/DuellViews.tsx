import { motion } from 'framer-motion';
import type { ControlsProps, StageProps } from '../types';
import { byId } from '../shared/fair';
import { Pills } from '../shared/ui';
import { WIN_POINTS, promptOf, type DuellAction, type DuellState } from './logic';

export function DuellStage({ state: s, ctx }: StageProps<DuellState>) {
  if (s.phase === 'ferdig') {
    return (
      <div className="scene">
        <p className="kicker">Juleduell</p>
        <h1 className="display md">Duellene er avgjort</h1>
        <div className="winners-strip">
          {Object.values(s.winners).map((id, i) => {
            const c = byId(ctx.contestants, id);
            return c ? <span key={i} className="winner-chip" style={{ ['--c' as string]: c.color }}>🏅 {c.emoji} {c.name} +{WIN_POINTS}</span> : null;
          })}
        </div>
      </div>
    );
  }
  const [a, b] = s.pairs[s.index].map((id) => byId(ctx.contestants, id));
  const winner = s.winners[s.index];
  const side = (c: typeof a, i: 0 | 1) => {
    if (!c) return null;
    const active = s.phase === 'duell' && s.active === i;
    const lost = s.phase === 'vinner' && winner !== c.id;
    const won = s.phase === 'vinner' && winner === c.id;
    return (
      <motion.div
        className={`duel-side ${active ? 'active' : ''} ${lost ? 'lost' : ''} ${won ? 'won' : ''}`}
        style={{ ['--c' as string]: c.color }}
        initial={{ x: i ? 400 : -400, opacity: 0 }}
        animate={{ x: 0, opacity: lost ? 0.35 : 1, scale: active || won ? 1.08 : 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 16 }}
      >
        <span className="e">{c.emoji}</span>
        <span className="n">{c.name}</span>
        {active && <span className="tag">Din tur!</span>}
        {won && <span className="tag">🏅 +{WIN_POINTS}</span>}
      </motion.div>
    );
  };
  return (
    <div className="scene duel">
      <Pills items={[`Duell ${s.index + 1} av ${s.pairs.length}`, s.phase === 'duell' ? `${s.count} svar så langt` : null]} />
      <motion.p key={promptOf(s)} className="duel-prompt" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        {promptOf(s)}
      </motion.p>
      <div className="duel-arena">
        {side(a, 0)}
        <motion.span className="duel-vs" animate={{ scale: [1, 1.12, 1] }} transition={{ repeat: Infinity, duration: 1.4 }}>
          VS
        </motion.span>
        {side(b, 1)}
      </div>
      {s.phase === 'presenter' && <p className="subtitle">Si én ting hver, annenhver gang. Fem sekunder på deg. Ingen gjentakelser!</p>}
    </div>
  );
}

export function DuellControls({ state: s, api }: ControlsProps<DuellState, DuellAction>) {
  if (s.phase === 'ferdig') return <p className="hp-note">Alle duellene er ferdige. Trykk «Vis poengtavla».</p>;
  if (s.phase === 'presenter')
    return (
      <div className="hp-stack">
        <p className="hp-note">Les kategorien og start duellen. Klokka går 5 sekunder per svar.</p>
        <div className="hp-row">
          <button className="hp-btn small" onClick={() => api.dispatch({ type: 'newPrompt' })}>
            🔀 Ny kategori
          </button>
        </div>
      </div>
    );
  if (s.phase === 'vinner') return <p className="hp-note">Vinneren har fått {WIN_POINTS} poeng. Trykk hovedknappen for neste duell.</p>;
  return (
    <div className="hp-stack">
      <p className="hp-note">Mellomrom godkjenner svaret og gir turen videre. Nøl, gjentakelse eller tiden ute? Trykk «Ute!».</p>
      <div className="hp-row">
        <button className="hp-btn gold" onClick={() => api.dispatch({ type: 'ok' })}>
          ✓ Godkjent, neste
        </button>
        <button className="hp-btn red" onClick={() => api.dispatch({ type: 'out' })}>
          ❌ Ute!
        </button>
      </div>
    </div>
  );
}
