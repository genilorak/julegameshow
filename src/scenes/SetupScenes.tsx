// Scenene før showet starter: velkommen, spillere, spillmodus, lag og rundeplan.
// `interactive` = scenen vises på programlederens egen skjerm og kan klikkes på.
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useGame } from '../core/store';
import { MAX_PLAYERS, MIN_PLAYERS, PLAYER_EMOJIS, recommendedMode, suggestTeamSizes } from '../core/teams';
import { getRound } from '../rounds/registry';
import { primaryStep } from '../core/flow';

export interface SceneProps {
  interactive: boolean;
}

const rise = (delay = 0) => ({
  initial: { opacity: 0, y: 40, filter: 'blur(10px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  transition: { delay, duration: 0.9, ease: [0.16, 1, 0.3, 1] as const },
});

export function WelcomeScene({ interactive }: SceneProps) {
  const go = useGame((s) => s.go);
  return (
    <div className="scene">
      <motion.p className="kicker" {...rise(0.2)}>
        Julen {new Date().getFullYear()} presenterer
      </motion.p>
      <motion.h1 className="display xl" {...rise(0.45)}>
        Familiens store
        <br />
        juleshow
      </motion.h1>
      <motion.p className="subtitle" {...rise(0.9)}>
        Én kveld. Én vinner. Altfor mye julemat.
      </motion.p>
      {interactive && (
        <motion.div className="stage-actions" {...rise(1.3)}>
          <button className="stage-btn" onClick={() => go('spillere')}>
            Start showet 🎄
          </button>
        </motion.div>
      )}
    </div>
  );
}

export function PlayersScene({ interactive }: SceneProps) {
  const s = useGame();
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const missing = MIN_PLAYERS - s.players.length;
  const add = () => {
    s.addPlayer(name);
    setName('');
  };
  return (
    <div className="scene">
      <motion.p className="kicker" {...rise(0)}>
        Kveldens deltakere
      </motion.p>
      <motion.h1 className="display md" {...rise(0.15)}>
        Hvem er med i kveld?
      </motion.h1>
      <div className="player-grid">
        <AnimatePresence>
          {s.players.map((p, i) => (
            <motion.div
              key={p.id}
              layout
              className="player-card"
              initial={{ opacity: 0, scale: 0.6, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            >
              {interactive && (
                <div className="card-tools">
                  <button className="icon-btn" title="Flytt til venstre" onClick={() => s.movePlayer(p.id, -1)} disabled={i === 0}>
                    ‹
                  </button>
                  <button className="icon-btn" title="Flytt til høyre" onClick={() => s.movePlayer(p.id, 1)} disabled={i === s.players.length - 1}>
                    ›
                  </button>
                  <button className="icon-btn" title="Fjern spiller" onClick={() => s.removePlayer(p.id)}>
                    ✕
                  </button>
                </div>
              )}
              <button
                className="emoji"
                style={{ background: 'none', border: 'none', padding: 0, cursor: interactive ? 'pointer' : 'default' }}
                title={interactive ? 'Bytt figur' : undefined}
                onClick={() => interactive && s.setPlayerEmoji(p.id, PLAYER_EMOJIS[(PLAYER_EMOJIS.indexOf(p.emoji) + 1) % PLAYER_EMOJIS.length])}
              >
                {p.emoji}
              </button>
              {interactive && editing === p.id ? (
                <input
                  className="stage-input"
                  autoFocus
                  defaultValue={p.name}
                  onBlur={(e) => {
                    if (e.target.value.trim()) s.renamePlayer(p.id, e.target.value.trim());
                    setEditing(null);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                />
              ) : (
                <div className="name" onDoubleClick={() => interactive && setEditing(p.id)} title={interactive ? 'Dobbeltklikk for å endre navn' : undefined}>
                  {p.name}
                </div>
              )}
            </motion.div>
          ))}
          {interactive && s.players.length < MAX_PLAYERS && (
            <motion.form
              key="add"
              layout
              className="player-card add"
              onSubmit={(e) => {
                e.preventDefault();
                add();
              }}
            >
              <input className="stage-input" placeholder="Navn" value={name} maxLength={24} onChange={(e) => setName(e.target.value)} />
              <button className="stage-btn" type="submit" style={{ marginTop: 0, padding: '16px 30px', fontSize: 28 }} disabled={!name.trim()}>
                + Legg til spiller
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
      <p className="subtitle" style={{ fontSize: 38 }}>
        {s.players.length === 0
          ? 'Legg til 4–10 spillere'
          : missing > 0
            ? `${s.players.length} med. Vi trenger minst ${missing} til!`
            : `${s.players.length} deltakere klare for juleshow`}
      </p>
      {interactive && <NextButton />}
    </div>
  );
}

export function ModeScene({ interactive }: SceneProps) {
  const s = useGame();
  const rec = recommendedMode(s.players.length);
  const n = s.players.length;
  const sizes = suggestTeamSizes(n);
  return (
    <div className="scene">
      <motion.p className="kicker" {...rise(0)}>
        Spillmodus
      </motion.p>
      <motion.h1 className="display md" {...rise(0.15)}>
        Hvordan spiller vi?
      </motion.h1>
      <div className="choice-row">
        {(
          [
            ['alle', '👤', 'Alle mot alle', 'Alle spiller for seg selv. Best for 4–5 spillere.'],
            ['lag', '👥', 'Lagspill', `${sizes.length} lag (${sizes.join(' + ')}). Best for 6 eller flere.`],
          ] as const
        ).map(([mode, emoji, title, text], i) => (
          <motion.button
            key={mode}
            className={`choice ${s.mode === mode ? 'selected' : ''}`}
            onClick={() => interactive && s.setMode(mode)}
            style={{ cursor: interactive ? 'pointer' : 'default' }}
            {...rise(0.3 + i * 0.15)}
          >
            {rec === mode && <span className="badge">Anbefalt for {n}</span>}
            <div className="big">{emoji}</div>
            <h3>{title}</h3>
            <p>{text}</p>
          </motion.button>
        ))}
      </div>
      {interactive && <NextButton />}
    </div>
  );
}

export function TeamsScene({ interactive }: SceneProps) {
  const s = useGame();
  const nameOf = (id: string) => s.players.find((p) => p.id === id);
  return (
    <div className="scene">
      <motion.p className="kicker" {...rise(0)}>
        Lagtrekning
      </motion.p>
      <motion.h1 className="display md" {...rise(0.15)}>
        Kveldens lag
      </motion.h1>
      <div className="team-row">
        {s.teams.map((t, ti) => (
          <motion.div key={t.id} className="team-col" style={{ ['--team' as string]: t.color }} {...rise(0.25 + ti * 0.1)}>
            <div className="team-emoji">{t.emoji}</div>
            <h3>{t.name}</h3>
            {t.playerIds.map((pid) => {
              const p = nameOf(pid);
              if (!p) return null;
              const nextTeam = s.teams[(ti + 1) % s.teams.length];
              return (
                <motion.button
                  layoutId={`member-${pid}`}
                  key={pid}
                  className="team-member"
                  transition={{ type: 'spring', stiffness: 220, damping: 24 }}
                  onClick={() => interactive && s.movePlayerToTeam(pid, nextTeam.id)}
                  title={interactive ? `Flytt til ${nextTeam.name}` : undefined}
                  style={{ cursor: interactive ? 'pointer' : 'default' }}
                >
                  <span>{p.emoji}</span> {p.name}
                </motion.button>
              );
            })}
          </motion.div>
        ))}
      </div>
      {interactive && (
        <div className="stage-actions">
          <button className="stage-btn ghost" onClick={() => s.drawTeams()}>
            🎲 Trekk på nytt
          </button>
          <NextButton inline />
        </div>
      )}
    </div>
  );
}

export function RoundsScene({ interactive }: SceneProps) {
  const s = useGame();
  const active = s.roundPlan.filter((r) => r.enabled && getRound(r.type));
  const minutes = active.reduce((sum, r) => sum + (getRound(r.type)?.minutes ?? 0), 0);
  let n = 0;
  return (
    <div className="scene">
      <motion.p className="kicker" {...rise(0)}>
        Kveldens program
      </motion.p>
      <motion.h1 className="display md" {...rise(0.15)}>
        Dette skal vi gjennom
      </motion.h1>
      <div className="plan-list">
        {s.roundPlan.map((r, i) => {
          const def = getRound(r.type);
          if (!def) return null;
          if (r.enabled) n++;
          return (
            <motion.button
              key={r.id}
              className={`plan-item ${r.enabled ? '' : 'off'}`}
              onClick={() => interactive && s.toggleRound(r.id)}
              style={{ cursor: interactive ? 'pointer' : 'default' }}
              {...rise(0.3 + i * 0.08)}
            >
              <span className="num">{r.enabled ? n : '–'}</span>
              <span className="emoji">{def.emoji}</span>
              <span>{def.title}</span>
              <span className="meta">{r.enabled ? `ca. ${def.minutes} min` : 'Hoppes over'}</span>
            </motion.button>
          );
        })}
        <motion.div className="plan-item" style={{ background: 'transparent', boxShadow: 'none' }} {...rise(0.6)}>
          <span className="num">🏆</span>
          <span>Vinnerkåring</span>
          <span className="meta">Totalt ca. {minutes + 5} min</span>
        </motion.div>
      </div>
      {interactive && <NextButton />}
    </div>
  );
}

/** Hovedknappen på selve TV-lerretet, brukt når programlederen styrer fra én skjerm. */
export function NextButton({ inline = false }: { inline?: boolean }) {
  const s = useGame();
  const step = primaryStep(s);
  if (!step) return null;
  return (
    <button className="stage-btn" style={inline ? { marginTop: 0 } : undefined} onClick={step.run} disabled={step.disabled} title={step.hint}>
      {step.label} →
    </button>
  );
}
