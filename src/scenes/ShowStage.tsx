import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { useGame } from '../core/store';
import { Stage } from '../design/Stage';
import { TimerRing } from '../design/TimerRing';
import { Confetti } from '../design/Confetti';
import { Scoreboard } from '../scoreboard/Scoreboard';
import { SoundManager } from '../sound/SoundManager';
import { getRound } from '../rounds/registry';
import { ModeScene, PlayersScene, RoundsScene, TeamsScene, WelcomeScene } from './SetupScenes';
import { IntroScene, RoundScene, WinnerScene } from './ShowScenes';
import type { SceneId } from '../core/types';

const SCENES: Record<SceneId, (p: { interactive: boolean }) => JSX.Element | null> = {
  velkommen: WelcomeScene,
  spillere: PlayersScene,
  modus: ModeScene,
  lag: TeamsScene,
  runder: RoundsScene,
  intro: IntroScene,
  runde: RoundScene,
  vinner: WinnerScene,
};

/**
 * Hele TV-bildet: bakgrunn, gjeldende scene og overlays (drama, pause, poengtavle, timer).
 * `audio` = dette vinduet spiller lyden (TV-vinduet, eller programlederen uten TV-vindu).
 */
export function ShowStage({ interactive, audio }: { interactive: boolean; audio: boolean }) {
  const scene = useGame((s) => s.scene);
  const fx = useGame((s) => s.fx);
  const paused = useGame((s) => s.paused);
  const showScoreboard = useGame((s) => s.showScoreboard);
  const timer = useGame((s) => s.timer);
  const roundTitle = useGame((s) => (s.scene === 'runde' ? getRound(s.roundPlan[s.roundIndex]?.type)?.title : undefined));
  const game = useGame();
  const Scene = SCENES[scene] ?? WelcomeScene;

  useSoundCues(audio);

  return (
    <Stage>
      <AnimatePresence mode="wait">
        <motion.div
          key={scene}
          style={{ position: 'absolute', inset: 0 }}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97, filter: 'blur(10px)' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <Scene interactive={interactive} />
        </motion.div>
      </AnimatePresence>

      {timer.durationMs > 0 && scene === 'runde' && <TimerRing timer={timer} style={{ right: 60, top: 60 }} />}

      <div className="stage-footer">
        <span className="brand">✦ Familiens store juleshow</span>
        <span>{roundTitle ?? ''}</span>
      </div>

      <AnimatePresence>
        {showScoreboard && (
          <motion.div key="sb" className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p className="kicker">Stillingen akkurat nå</p>
            <h1 className="display md">Poengtavla</h1>
            <Scoreboard game={game} />
          </motion.div>
        )}
        {fx && (
          <motion.div key={fx.id} className="overlay" style={{ zIndex: 35 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.5 } }}>
            <div className={`fx-rays ${fx.kind === 'au' || fx.kind === 'tid' ? 'red' : ''}`} />
            {(fx.kind === 'julemirakel' || fx.kind === 'comeback') && <Confetti fire={fx.id} />}
            <motion.h1 className="fx-title" initial={{ scale: 2.4, opacity: 0, rotate: -4 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 14 }}>
              {fx.title}
            </motion.h1>
            {fx.subtitle && (
              <motion.p className="fx-sub" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                {fx.subtitle}
              </motion.p>
            )}
          </motion.div>
        )}
        {paused && (
          <motion.div key="pause" className="overlay" style={{ zIndex: 38 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p className="kicker">Pause</p>
            <h1 className="display">Kort pause</h1>
            <p className="subtitle">Hent mer gløgg. Showet fortsetter straks 🍷</p>
          </motion.div>
        )}
      </AnimatePresence>
    </Stage>
  );
}

/** Spiller lyden hver gang spillet ber om en ny lyd (cue), hvis dette vinduet har lyden. */
function useSoundCues(audio: boolean) {
  const cue = useGame((s) => s.cue);
  const enabled = useGame((s) => s.settings.sound);
  const lastId = useRef(cue?.id);
  useEffect(() => {
    SoundManager.enabled = enabled;
  }, [enabled]);
  useEffect(() => {
    if (!cue || cue.id === lastId.current) return;
    lastId.current = cue.id;
    if (audio) SoundManager.play(cue.name);
  }, [cue, audio]);
}
