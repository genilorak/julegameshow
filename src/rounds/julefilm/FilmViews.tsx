import { AnimatePresence, motion } from 'framer-motion';
import type { ControlsProps, StageProps } from '../types';
import { byId } from '../shared/fair';
import { MarkChips } from '../shared/marks';
import { Answer, BigReveal, Pills } from '../shared/ui';
import { filmById } from './films';
import { POINTS, pointsNow, type FilmAction, type FilmState } from './logic';

export function FilmStage({ state: s, ctx }: StageProps<FilmState>) {
  const f = filmById(s.ids[s.index]);
  if (!f) {
    return (
      <div className="scene">
        <p className="kicker">Gjett julefilmen</p>
        <h1 className="display md">Rulleteksten går!</h1>
        <p className="subtitle">Alle filmene er gjettet. Popkornet kan legges bort.</p>
      </div>
    );
  }
  const winnerId = Object.keys(s.marks[s.index] ?? {})[0];
  const winner = byId(ctx.contestants, winnerId);
  const out = (s.out[s.index] ?? []).map((id) => byId(ctx.contestants, id)).filter(Boolean);

  return (
    <AnimatePresence>
      <motion.div key={f.id} className="scene film" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, filter: 'blur(8px)' }} transition={{ duration: 0.6 }}>
        <Pills items={[`Film ${s.index + 1} av ${s.ids.length}`, s.phase === 'hint' ? `Verdt ${pointsNow(s)} poeng nå` : null]} />
        {s.phase === 'svar' ? (
          <>
            <BigReveal kicker="Filmen var" sub={f.year}>
              {`${f.emoji} ${f.title}`}
            </BigReveal>
            {winner ? (
              <motion.p className="fx-sub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                {winner.emoji} {winner.name} tok den og får {POINTS[s.hints - 1]} poeng!
              </motion.p>
            ) : (
              <p className="subtitle" style={{ marginTop: 30 }}>Ingen fikk den denne gangen.</p>
            )}
          </>
        ) : (
          <div className="film-hints">
            {f.hints.slice(0, s.hints).map((h, i) => (
              <motion.div key={i} className={`film-hint ${i === s.hints - 1 ? 'latest' : ''}`} initial={{ opacity: 0, x: -80, rotateY: 30 }} animate={{ opacity: 1, x: 0, rotateY: 0 }} transition={{ type: 'spring', stiffness: 110, damping: 16 }}>
                <span className="num">Hint {i + 1}</span>
                <span className="txt">{h}</span>
                <span className="val">{POINTS[i]} p</span>
              </motion.div>
            ))}
            {Array.from({ length: 3 - s.hints }, (_, i) => (
              <div key={`l${i}`} className="film-hint locked">
                <span className="num">Hint {s.hints + i + 1}</span>
                <span className="txt">🔒</span>
              </div>
            ))}
          </div>
        )}
        {s.phase === 'hint' && out.length > 0 && (
          <div className="winners-strip">
            {out.map((c) => (
              <span key={c!.id} className="winner-chip out" style={{ ['--c' as string]: c!.color }}>
                ✗ {c!.emoji} {c!.name}
              </span>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

export function FilmControls({ state: s, ctx, api, showAnswers }: ControlsProps<FilmState, FilmAction>) {
  const f = filmById(s.ids[s.index]);
  if (!f) return <p className="hp-note">Alle filmene er ferdige. Trykk «Vis poengtavla».</p>;
  const out = s.out[s.index] ?? [];
  return (
    <div className="hp-stack">
      <Answer show={showAnswers}>
        {f.title} ({f.year})
      </Answer>
      <p className="hp-note">Første som roper riktig får poengene. Feil svar betyr ute for denne filmen.</p>
      <MarkChips contestants={ctx.contestants} marks={s.marks[s.index]} points={pointsNow(s)} reason={`Julefilm: ${f.title}`} api={api} single label={`Riktig svar (+${pointsNow(s)})`} />
      <div>
        <span className="hp-label">Feil svar (ute denne filmen)</span>
        <div className="hp-chips">
          {ctx.contestants.map((c) => (
            <button
              key={c.id}
              className={`hp-chip ${out.includes(c.id) ? 'on' : ''}`}
              style={{ ['--c' as string]: '#c9343f' }}
              onClick={() => {
                if (!out.includes(c.id)) api.sound('feil');
                api.dispatch({ type: 'wrong', contestantId: c.id });
              }}
            >
              {c.emoji} {c.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
