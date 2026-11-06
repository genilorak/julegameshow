import { AnimatePresence, motion } from 'framer-motion';
import type { StageProps } from '../types';
import { pointsFor, questionById, type QuizState } from './logic';

const LETTERS = ['A', 'B', 'C', 'D'];
const DIFF = ['', 'Lett', 'Middels', 'Vanskelig'];

export function QuizStage({ state, ctx }: StageProps<QuizState>) {
  if (state.index >= state.ids.length) {
    return (
      <div className="scene">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <p className="kicker">Den store julequizen</p>
          <h1 className="display md">Quizen er over!</h1>
          <p className="subtitle">Hvem har mest å juble for? La oss se på poengtavla.</p>
        </motion.div>
      </div>
    );
  }
  const q = questionById(state.ids[state.index]);
  if (!q) return null;
  const revealed = state.phase === 'svar';
  const winners = ctx.contestants.filter((c) => state.marks[state.index]?.[c.id]);

  return (
    <AnimatePresence>
      <motion.div
        key={q.id}
        className="scene quiz"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -30, filter: 'blur(8px)' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="quiz-meta">
          <span className="pill">
            Spørsmål {state.index + 1} av {state.ids.length}
          </span>
          <span className="pill">{q.category}</span>
          <span className={`pill ${q.difficulty === 3 ? 'red' : ''}`}>
            {DIFF[q.difficulty]} · {pointsFor(q)} p
          </span>
        </div>
        <h2 className="headline">{q.text}</h2>
        <div className="options">
          {q.options.map((opt, i) => (
            <motion.div
              key={i}
              className={`option ${revealed ? (i === q.correct ? 'correct' : 'dim') : ''}`}
              initial={{ opacity: 0, x: i % 2 ? 60 : -60 }}
              animate={{ opacity: revealed && i !== q.correct ? 0.28 : 1, x: 0, scale: revealed && i === q.correct ? 1.04 : 1 }}
              transition={{ delay: revealed ? 0 : 0.5 + i * 0.18, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="letter">{LETTERS[i]}</span>
              <span>{opt}</span>
            </motion.div>
          ))}
        </div>
        <AnimatePresence>
          {revealed && q.fact && (
            <motion.p className="quiz-fact" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: 0.6 }}>
              {q.fact}
            </motion.p>
          )}
        </AnimatePresence>
        {revealed && winners.length > 0 && (
          <div className="winners-strip">
            {winners.map((c) => (
              <motion.span key={c.id} className="winner-chip" style={{ ['--c' as string]: c.color }} initial={{ scale: 0 }} animate={{ scale: 1 }}>
                {c.emoji} {c.name} +{pointsFor(q)}
              </motion.span>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
