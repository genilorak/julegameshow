import { AnimatePresence, motion } from 'framer-motion';
import type { ControlsProps, StageProps } from '../types';
import { MarkChips, WinnersStrip } from '../shared/marks';
import { Answer, BigReveal, Pills } from '../shared/ui';
import { POINTS, type BildeAction, type BildeState } from './logic';
import { puzzleById } from './puzzles';

export function BildeStage({ state: s, ctx }: StageProps<BildeState>) {
  const p = puzzleById(s.ids[s.index]);
  if (!p) {
    return (
      <div className="scene">
        <p className="kicker">Bildeoppgaver</p>
        <h1 className="display md">Alle rebusene er løst!</h1>
        <p className="subtitle">Eller i hvert fall forsøkt løst.</p>
      </div>
    );
  }
  return (
    <AnimatePresence>
      <motion.div key={p.id} className="scene" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, filter: 'blur(8px)' }} transition={{ duration: 0.5 }}>
        <Pills items={[`Bilde ${s.index + 1} av ${s.ids.length}`, p.category, `${POINTS} p`]} />
        {p.image ? (
          <motion.img className="rebus-img" src={p.image} alt="" initial={{ scale: 3 }} animate={{ scale: 1 }} transition={{ duration: 6, ease: 'easeOut' }} />
        ) : (
          <div className="rebus">
            {[...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(p.emoji)].map((g, i) => (
              <motion.span key={i} initial={{ opacity: 0, y: 60, scale: 0.3 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.3 + i * 0.35, type: 'spring', stiffness: 160, damping: 12 }}>
                {g.segment}
              </motion.span>
            ))}
          </div>
        )}
        {s.phase === 'hint' && (
          <motion.p className="quiz-fact" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            Hint: {p.hint}
          </motion.p>
        )}
        {s.phase === 'svar' && (
          <>
            <BigReveal kicker="Svaret er">{p.answer}</BigReveal>
            <WinnersStrip contestants={ctx.contestants} marks={s.marks[s.index]} points={POINTS} />
          </>
        )}
        {s.phase === 'sporsmal' && <p className="subtitle" style={{ marginTop: 30 }}>Skriv svaret på lappen.</p>}
      </motion.div>
    </AnimatePresence>
  );
}

export function BildeControls({ state: s, ctx, api, showAnswers }: ControlsProps<BildeState, BildeAction>) {
  const p = puzzleById(s.ids[s.index]);
  if (!p) return <p className="hp-note">Ferdig. Trykk «Vis poengtavla».</p>;
  return (
    <div className="hp-stack">
      <Answer show={showAnswers}>{p.answer}</Answer>
      <MarkChips contestants={ctx.contestants} marks={s.marks[s.index]} points={POINTS} reason={`Bildeoppgave: ${p.answer}`} api={api} />
    </div>
  );
}
