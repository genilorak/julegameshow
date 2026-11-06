import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Confetti } from '../../design/Confetti';
import type { ControlsProps, StageProps } from '../types';
import { Pills } from '../shared/ui';
import { HVEM_QUESTIONS, type HvemAction, type HvemState } from './logic';

/** 3 – 2 – 1 – PEK! */
function Countdown() {
  const [n, setN] = useState(3);
  useEffect(() => {
    if (n <= 0) return;
    const t = setTimeout(() => setN(n - 1), 900);
    return () => clearTimeout(t);
  }, [n]);
  return (
    <AnimatePresence mode="popLayout">
      <motion.div key={n} className="countdown" initial={{ scale: 2.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.4, opacity: 0 }} transition={{ type: 'spring', stiffness: 220, damping: 14 }}>
        {n > 0 ? n : 'PEK! 👉'}
      </motion.div>
    </AnimatePresence>
  );
}

export function HvemStage({ state: s, ctx }: StageProps<HvemState>) {
  if (s.index >= s.ids.length) {
    return (
      <div className="scene">
        <p className="kicker">Hvem i familien?</p>
        <h1 className="display md">Nå vet vi litt mer om hverandre</h1>
        <p className="subtitle">Ingen poeng her, bare æren. Og kanskje litt erting resten av kvelden.</p>
      </div>
    );
  }
  const q = HVEM_QUESTIONS[s.ids[s.index]];
  const chosen = (s.chosen[s.index] ?? []).map((id) => ctx.players.find((p) => p.id === id)).filter(Boolean);
  return (
    <AnimatePresence>
      <motion.div key={`${s.index}-${s.phase === 'avslor'}`} className="scene" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
        <Pills items={[`Spørsmål ${s.index + 1} av ${s.ids.length}`, 'Ingen poeng, bare ære']} />
        {s.phase !== 'avslor' && <h2 className="headline" style={{ maxWidth: 1500 }}>{q}</h2>}
        {s.phase === 'sporsmal' && <p className="subtitle" style={{ marginTop: 40 }}>Tenk dere om. Når jeg teller ned, peker alle på samme tid.</p>}
        {s.phase === 'pek' && <Countdown />}
        {s.phase === 'avslor' && (
          <>
            <p className="kicker">{q}</p>
            {chosen.length ? (
              <div className="spotlight-row">
                <Confetti fire={`hvem-${s.index}`} />
                {chosen.map((p, i) => (
                  <motion.div key={p!.id} className="spotlight" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + i * 0.25, type: 'spring', stiffness: 140, damping: 12 }}>
                    <div className="cone" />
                    <span className="e">{p!.emoji}</span>
                    <span className="n">{p!.name}</span>
                  </motion.div>
                ))}
              </div>
            ) : (
              <h1 className="display md">Familien er uenig!</h1>
            )}
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

export function HvemControls({ state: s, ctx, api }: ControlsProps<HvemState, HvemAction>) {
  if (s.index >= s.ids.length) return <p className="hp-note">Ferdig. Trykk «Vis poengtavla» for å gå videre.</p>;
  const chosen = s.chosen[s.index] ?? [];
  return (
    <div className="hp-stack">
      <p className="hp-note">Les spørsmålet, trykk «Tell ned», og la alle peke. Velg den (eller de) som fikk flest, og avslør.</p>
      <div>
        <span className="hp-label">Flest pekte på</span>
        <div className="hp-chips">
          {ctx.players.map((p) => (
            <button key={p.id} className={`hp-chip ${chosen.includes(p.id) ? 'on' : ''}`} onClick={() => api.dispatch({ type: 'choose', playerId: p.id })}>
              {p.emoji} {p.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
