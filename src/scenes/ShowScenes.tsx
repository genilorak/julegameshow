// Scenene under selve showet: intro, rundene og vinnerkåringen.
import { AnimatePresence, motion } from 'framer-motion';
import { useGame, roundContext, nextEnabledIndex } from '../core/store';
import { standings, totals } from '../core/score';
import { contestantsOf } from '../core/teams';
import { getRound } from '../rounds/registry';
import { Scoreboard } from '../scoreboard/Scoreboard';
import { Confetti } from '../design/Confetti';
import { introSteps } from '../core/flow';
import type { SceneProps } from './SetupScenes';
import { NextButton } from './SetupScenes';

export function IntroScene({ interactive }: SceneProps) {
  const s = useGame();
  const contestants = contestantsOf(s);
  const step = s.revealCount;
  const last = introSteps(s) - 1;
  const current = step >= 1 && step <= contestants.length ? contestants[step - 1] : null;
  const nameOf = (id: string) => s.players.find((p) => p.id === id)?.name;

  return (
    <div className="scene">
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div key="t" initial={{ opacity: 0, scale: 1.15 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9, filter: 'blur(12px)' }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}>
            <p className="kicker">Mine damer og herrer</p>
            <h1 className="display xl">Velkommen til showet!</h1>
            <p className="subtitle">Kveldens deltakere er…</p>
          </motion.div>
        )}
        {current && (
          <motion.div key={current.id} initial={{ opacity: 0, y: 80, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, x: -200, filter: 'blur(10px)' }} transition={{ type: 'spring', stiffness: 140, damping: 18 }}>
            <p className="kicker">
              Deltaker {step} av {contestants.length}
            </p>
            <div className="round-emoji" style={{ fontSize: 240 }}>
              {current.emoji}
            </div>
            <h1 className="display xl">{current.name}</h1>
            {s.mode === 'lag' && <p className="subtitle">{current.playerIds.map(nameOf).join(', ')}</p>}
          </motion.div>
        )}
        {step === last && (
          <motion.div key="go" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 120, damping: 14 }}>
            <div className="player-grid" style={{ marginTop: 0, marginBottom: 50 }}>
              {contestants.map((c) => (
                <span key={c.id} style={{ fontSize: 90 }}>
                  {c.emoji}
                </span>
              ))}
            </div>
            <h1 className="display xl">La showet begynne!</h1>
          </motion.div>
        )}
      </AnimatePresence>
      {interactive && <NextButton />}
    </div>
  );
}

export function RoundScene({ interactive }: SceneProps) {
  const s = useGame();
  const inst = s.roundPlan[s.roundIndex];
  const def = getRound(inst?.type);
  if (!def) return null;
  const number = s.roundPlan.slice(0, s.roundIndex + 1).filter((r) => r.enabled && getRound(r.type)).length;
  const ctx = roundContext(s);
  const isLast = nextEnabledIndex(s.roundPlan, s.roundIndex) === -1;

  return (
    <AnimatePresence mode="wait">
      {s.roundPhase === 'intro' && (
        <motion.div key={`intro-${inst.id}`} className="scene" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.1, filter: 'blur(14px)' }} transition={{ duration: 0.7 }}>
          <motion.div className="round-number" initial={{ opacity: 0, letterSpacing: '1.2em' }} animate={{ opacity: 1, letterSpacing: '0.5em' }} transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}>
            Runde {number}
          </motion.div>
          <motion.div className="round-emoji" initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.3, type: 'spring', stiffness: 160, damping: 12 }}>
            {def.emoji}
          </motion.div>
          <motion.h1 className="display" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
            {def.title}
          </motion.h1>
          <motion.p className="subtitle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>
            {def.tagline}
          </motion.p>
          <ul className="rules">
            {def.rules.map((r, i) => (
              <motion.li key={r} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.2 + i * 0.2 }}>
                {r}
              </motion.li>
            ))}
          </ul>
          {interactive && <NextButton />}
        </motion.div>
      )}
      {s.roundPhase === 'spill' && s.roundState != null && (
        <motion.div key={`play-${inst.id}`} style={{ position: 'absolute', inset: 0 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <def.Stage state={s.roundState} ctx={ctx} />
        </motion.div>
      )}
      {s.roundPhase === 'poeng' && (
        <motion.div key={`score-${inst.id}`} className="scene" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
          <p className="kicker">Stillingen etter runde {number}</p>
          <h1 className="display md">{isLast ? 'Før vinnerkåringen' : 'Poengtavla'}</h1>
          <Scoreboard game={s} />
          {interactive && <NextButton />}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Vinnernavnet skal være så stort som mulig, men alltid få plass. */
const championSize = (text: string) => (text.length <= 14 ? 170 : text.length <= 22 ? 130 : text.length <= 36 ? 96 : 72);

const PLACE_WORDS = ['', 'Vinner', '2. plass', '3. plass', '4. plass', '5. plass', '6. plass', '7. plass', '8. plass', '9. plass', '10. plass'];

export function WinnerScene({ interactive }: SceneProps) {
  const s = useGame();
  const contestants = contestantsOf(s);
  const rows = standings(contestants, totals(s.scoreLog, contestants));
  const total = rows.length;
  // Avsløres fra sist til først: revealCount = hvor mange av de nederste som vises.
  const shown = rows.slice(total - s.revealCount);
  const done = s.revealCount >= total && total > 0;
  const champions = rows.filter((r) => r.place === 1);
  const nameOf = (id: string) => s.players.find((p) => p.id === id)?.name;

  if (done) {
    const champ = champions[0];
    return (
      <div className="scene">
        <Confetti fire={s.gameId} big />
        <motion.div className="trophy" initial={{ scale: 0, rotate: -25 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 120, damping: 10 }}>
          🏆
        </motion.div>
        <motion.p className="kicker" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          {champions.length > 1 ? 'Delt seier! Årets julemestere' : s.mode === 'lag' ? 'Årets julemestere' : 'Årets julemester'}
        </motion.p>
        <motion.div className="champion-name" style={{ fontSize: championSize(champions.map((c) => c.contestant.name).join(' & ')) }} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8, type: 'spring', stiffness: 90, damping: 12 }}>
          {champions.map((c) => `${c.contestant.emoji} ${c.contestant.name}`).join(' & ')}
        </motion.div>
        {champ && s.mode === 'lag' && champions.length === 1 && (
          <motion.p className="subtitle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}>
            {champ.contestant.playerIds.map(nameOf).join(', ')}
          </motion.p>
        )}
        <motion.p className="subtitle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}>
          {champ?.score.toLocaleString('nb-NO')} poeng. Gratulerer!
        </motion.p>
        {interactive && <NextButton />}
      </div>
    );
  }

  return (
    <div className="scene">
      <p className="kicker">{s.revealCount === 0 ? 'Øyeblikket vi har ventet på' : 'Vinnerkåringen'}</p>
      <h1 className="display md">{s.revealCount === 0 ? 'Vi har en vinner!' : 'Og plasseringene er…'}</h1>
      <div className="podium-list">
        <AnimatePresence>
          {[...shown].reverse().map((r) => (
            <motion.div key={r.contestant.id} className="podium-row" initial={{ opacity: 0, x: -120, scale: 0.9 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 140, damping: 18 }}>
              <span className="place">{PLACE_WORDS[r.place] ?? `${r.place}. plass`}</span>
              <span>{r.contestant.emoji}</span>
              <span className="n">{r.contestant.name}</span>
              <span className="pts">{r.score.toLocaleString('nb-NO')}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {s.revealCount === 0 && <p className="subtitle">Vi avslører fra sist til først…</p>}
      {interactive && <NextButton />}
    </div>
  );
}
