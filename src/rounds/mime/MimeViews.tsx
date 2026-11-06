import { motion } from 'framer-motion';
import { useState } from 'react';
import { Emo } from '../../design/Emo';
import type { ControlsProps, StageProps } from '../types';
import { byId } from '../shared/fair';
import { PickContestant, Pills, TurnBadge } from '../shared/ui';
import { POINTS, taskOf, type MimeAction, type MimeState } from './logic';

export function MimeStage({ state: s, ctx }: StageProps<MimeState>) {
  const me = byId(ctx.contestants, s.order[s.turn]);
  if (s.phase === 'ferdig') {
    const ok = Object.values(s.results).filter((r) => r.guessed).length;
    return (
      <div className="scene">
        <p className="kicker">Mime</p>
        <h1 className="display md">
          <Emo text="Teppefall! 🎭" />
        </h1>
        <p className="subtitle">
          {ok} av {s.order.length} oppgaver ble gjettet. For noen skuespillere!
        </p>
      </div>
    );
  }
  const res = s.results[s.turn];
  const guesser = byId(ctx.contestants, res?.guesser ?? undefined);
  return (
    <div className="scene">
      <Pills items={[`Tur ${s.turn + 1} av ${s.order.length}`, `${POINTS} p`]} />
      <TurnBadge c={me} label={ctx.mode === 'lag' ? 'velg en som mimer' : 'mimer'} size="lg" />
      {s.phase === 'klar' && <p className="subtitle" style={{ marginTop: 40 }}>Mimeren kommer bort til laptopen og ser oppgaven. Ingen lyder, ingen ord!</p>}
      {s.phase === 'mimer' && (
        <motion.div className="mime-masks" animate={{ rotate: [-6, 6, -6] }} transition={{ repeat: Infinity, duration: 1.6 }}>
          🎭
        </motion.div>
      )}
      {s.phase === 'mimer' && <p className="subtitle">{ctx.mode === 'lag' ? 'Laget gjetter. ' : 'Alle gjetter. '}Ingen ord, ingen lyder!</p>}
      {s.phase === 'resultat' && (
        <motion.div initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 150, damping: 13 }}>
          <p className="kicker">Oppgaven var</p>
          <h1 className="display sm">{taskOf(s)}</h1>
          <p className="fx-sub">{res?.guessed ? (guesser && guesser.id !== me?.id ? `${guesser.emoji} ${guesser.name} gjettet det! +${POINTS} til begge` : `Gjettet! +${POINTS}`) : 'Ingen klarte det i tide'}</p>
        </motion.div>
      )}
    </div>
  );
}

export function MimeControls({ state: s, ctx, api, showAnswers }: ControlsProps<MimeState, MimeAction>) {
  const [peek, setPeek] = useState(false);
  const me = s.order[s.turn];
  if (s.phase === 'ferdig') return <p className="hp-note">Ferdig. Trykk «Vis poengtavla».</p>;
  if (s.phase === 'resultat') return <p className="hp-note">Trykk hovedknappen for neste mimer.</p>;
  const task = (
    <div className="hp-answer" style={{ fontSize: 22 }}>
      <span className="hp-label">Oppgaven (bare for mimeren)</span>
      <strong>{taskOf(s)}</strong>
    </div>
  );
  return (
    <div className="hp-stack">
      {showAnswers ? (
        task
      ) : (
        <>
          <button className="hp-btn" onPointerDown={() => setPeek(true)} onPointerUp={() => setPeek(false)} onPointerLeave={() => setPeek(false)}>
            👀 Hold inne for å se oppgaven
          </button>
          {peek && task}
        </>
      )}
      <div className="hp-row">
        <button className="hp-btn small" onClick={() => api.dispatch({ type: 'skip' })}>
          🔀 Ny oppgave
        </button>
        {s.phase === 'mimer' && (
          <button className="hp-btn red small" onClick={() => api.dispatch({ type: 'timeout' })}>
            ⏰ Tiden er ute
          </button>
        )}
      </div>
      {s.phase === 'mimer' &&
        (ctx.mode === 'lag' ? (
          <button className="hp-btn gold" onClick={() => api.dispatch({ type: 'guessed', guesserId: null })}>
            ✓ Laget gjettet det (+{POINTS})
          </button>
        ) : (
          <PickContestant label={`Hvem gjettet det? (+${POINTS} til begge)`} contestants={ctx.contestants} onPick={(id) => api.dispatch({ type: 'guessed', guesserId: id })} disabled={(c) => c.id === me} />
        ))}
    </div>
  );
}
