import { AnimatePresence, motion } from 'framer-motion';
import type { ControlsProps, StageProps } from '../types';
import { byId } from '../shared/fair';
import { Answer, TurnBadge } from '../shared/ui';
import { POINTS, currentQuestion, type LynAction, type LynState } from './logic';

export function LynStage({ state: s, ctx }: StageProps<LynState>) {
  const me = byId(ctx.contestants, s.order[s.turn]);
  if (s.phase === 'ferdig') {
    const ranked = [...s.order].sort((a, b) => (s.results[b]?.right ?? 0) - (s.results[a]?.right ?? 0));
    return (
      <div className="scene">
        <p className="kicker">Lynrunden</p>
        <h1 className="display md">Lynraske resultater</h1>
        <div className="lyn-results">
          {ranked.map((id, i) => {
            const c = byId(ctx.contestants, id)!;
            const r = s.results[id]?.right ?? 0;
            return (
              <motion.div key={id} className="lyn-result" style={{ ['--c' as string]: c.color }} initial={{ opacity: 0, x: -60 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.12 }}>
                <span>{c.emoji} {c.name}</span>
                <strong>{r} riktige · +{r * POINTS}</strong>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }
  const r = s.results[s.order[s.turn]] ?? { right: 0, pass: 0 };
  const q = currentQuestion(s);
  return (
    <div className="scene lyn">
      <TurnBadge c={me} label={s.phase === 'klar' ? 'gjør deg klar' : s.phase === 'spill' ? 'svarer nå' : 'ferdig!'} size="lg" />
      {s.phase === 'klar' && <p className="subtitle" style={{ marginTop: 40 }}>45 sekunder. Så mange riktige du klarer. Si «pass» hvis du står fast.</p>}
      {s.phase === 'spill' && (
        <AnimatePresence mode="popLayout">
          <motion.h2 key={s.q} className="headline lyn-q" initial={{ opacity: 0, x: 120 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -120 }} transition={{ duration: 0.25 }}>
            {q[0]}
          </motion.h2>
        </AnimatePresence>
      )}
      <div className="lyn-count">
        <motion.span key={`r${r.right}`} className="right" initial={{ scale: 1.6 }} animate={{ scale: 1 }}>
          ⚡ {r.right}
        </motion.span>
        <span className="pass">pass {r.pass}</span>
      </div>
      {s.phase === 'tur-ferdig' && (
        <motion.p className="fx-sub" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {r.right} riktige gir {r.right * POINTS} poeng!
        </motion.p>
      )}
    </div>
  );
}

export function LynControls({ state: s, api, showAnswers }: ControlsProps<LynState, LynAction>) {
  if (s.phase === 'ferdig') return <p className="hp-note">Alle har hatt sin tur. Trykk «Vis poengtavla».</p>;
  const q = currentQuestion(s);
  if (s.phase === 'klar') return <p className="hp-note">Trykk «Start turen» når deltakeren er klar. Klokka starter med en gang.</p>;
  if (s.phase === 'tur-ferdig') return <p className="hp-note">Turen er over. Trykk hovedknappen for neste deltaker.</p>;
  return (
    <div className="hp-stack">
      <div className="hp-answer" style={{ background: 'rgba(247,240,225,0.06)', boxShadow: '0 0 0 1px rgba(247,240,225,0.2) inset' }}>
        <span className="hp-label">Les opp</span>
        <strong>{q[0]}</strong>
      </div>
      <Answer show={showAnswers}>{q[1]}</Answer>
      <div className="hp-row">
        <button className="hp-btn gold" onClick={() => api.dispatch({ type: 'right' })}>
          ✓ Riktig (mellomrom)
        </button>
        <button className="hp-btn" onClick={() => api.dispatch({ type: 'pass' })}>
          Pass / feil
        </button>
        <button className="hp-btn red" onClick={() => api.dispatch({ type: 'stop' })}>
          ⏱ Tiden er ute
        </button>
      </div>
    </div>
  );
}
