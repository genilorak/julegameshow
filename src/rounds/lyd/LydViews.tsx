import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { melodyById, melodySeconds } from '../../sound/melodies';
import type { ControlsProps, StageProps } from '../types';
import { MarkChips, WinnersStrip } from '../shared/marks';
import { Answer, BigReveal, Pills } from '../shared/ui';
import { POINTS, type LydAction, type LydState } from './logic';

function Equalizer({ on }: { on: boolean }) {
  return (
    <div className={`eq ${on ? 'on' : ''}`}>
      {Array.from({ length: 24 }, (_, i) => (
        <span key={i} style={{ animationDelay: `${(i * 137) % 900}ms`, animationDuration: `${600 + ((i * 53) % 500)}ms` }} />
      ))}
    </div>
  );
}

export function LydStage({ state: s, ctx }: StageProps<LydState>) {
  const m = melodyById(s.ids[s.index]);
  if (!m) {
    return (
      <div className="scene">
        <p className="kicker">Lydoppgaver</p>
        <h1 className="display md">Orkesteret tar pause</h1>
        <p className="subtitle">Alle melodiene er spilt.</p>
      </div>
    );
  }
  return (
    <AnimatePresence>
      <motion.div key={m.id} className="scene" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <Pills items={[`Melodi ${s.index + 1} av ${s.ids.length}`, `${POINTS} p`]} />
        {s.phase === 'lytt' ? (
          <>
            <motion.div className="music-note" animate={s.playing ? { rotate: [-8, 8, -8], y: [0, -14, 0] } : { rotate: 0 }} transition={{ repeat: Infinity, duration: 1.2 }}>
              🎵
            </motion.div>
            <h2 className="headline">Hvilken julesang er dette?</h2>
            <Equalizer on={s.playing} />
            <p className="subtitle">{s.playing ? 'Lytt godt…' : s.plays ? 'Skriv svaret på lappen' : 'Gjør dere klare'}</p>
          </>
        ) : (
          <>
            <BigReveal kicker="Melodien var">{`🎶 ${m.title}`}</BigReveal>
            <WinnersStrip contestants={ctx.contestants} marks={s.marks[s.index]} points={POINTS} />
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

export function LydControls({ state: s, ctx, api, showAnswers }: ControlsProps<LydState, LydAction>) {
  const m = melodyById(s.ids[s.index]);
  // «Spiller nå» slår seg av når melodien er ferdig.
  useEffect(() => {
    if (!s.playing || !m) return;
    const t = setTimeout(() => api.dispatch({ type: 'stop' }), melodySeconds(m) * 1000 + 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.playing, s.plays, m?.id]);
  if (!m) return <p className="hp-note">Ferdig. Trykk «Vis poengtavla».</p>;
  return (
    <div className="hp-stack">
      <Answer show={showAnswers}>{m.accept}</Answer>
      <div className="hp-row">
        <button className="hp-btn gold" onClick={() => api.dispatch({ type: 'play' })}>
          ▶ {s.plays ? 'Spill igjen' : 'Spill melodien'}
        </button>
        <button className="hp-btn" onClick={() => api.dispatch({ type: 'stop' })} disabled={!s.playing}>
          ■ Stopp
        </button>
      </div>
      <p className="hp-note">Lyden kommer fra TV-vinduet når det er åpent. Ellers fra denne maskinen.</p>
      <MarkChips contestants={ctx.contestants} marks={s.marks[s.index]} points={POINTS} reason={`Lydoppgave: ${m.title}`} api={api} />
    </div>
  );
}
