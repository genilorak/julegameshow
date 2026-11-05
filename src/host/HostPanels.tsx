// Kontrollene programlederen bruker på laptopen. Alt her er usynlig for TV-en.
import { useState } from 'react';
import { backStep, primaryStep } from '../core/flow';
import { roundContext, useGame } from '../core/store';
import { standings, totals } from '../core/score';
import { MAX_PLAYERS, MIN_PLAYERS, PLAYER_EMOJIS, contestantsOf, suggestTeamSizes } from '../core/teams';
import { getRound } from '../rounds/registry';
import type { RoundApi } from '../rounds/types';
import { useTimeLeft } from '../core/useNow';

const SCENE_NAMES: Record<string, string> = {
  velkommen: 'Velkommen',
  spillere: 'Spillere',
  modus: 'Spillmodus',
  lag: 'Lag',
  runder: 'Kveldens runder',
  intro: 'Showintro',
  runde: 'Runde',
  vinner: 'Vinnerkåring',
};

export function FlowCard() {
  const s = useGame();
  const primary = primaryStep(s);
  const back = backStep(s);
  const def = s.scene === 'runde' ? getRound(s.roundPlan[s.roundIndex]?.type) : undefined;
  const phase = s.scene === 'runde' ? ({ intro: 'intro', spill: 'pågår', poeng: 'poengtavle' } as const)[s.roundPhase] : '';
  return (
    <div className="hp-card">
      <h3>
        Nå: {def ? `${def.emoji} ${def.title} · ${phase}` : SCENE_NAMES[s.scene]}
      </h3>
      <div className="hp-primary">
        <button className="hp-btn go" onClick={back?.run} disabled={!back} title="Tilbake (←)">
          ←
        </button>
        {primary && (
          <button className="hp-btn gold go" onClick={primary.run} disabled={primary.disabled} title="Neste (mellomrom)">
            {primary.label} →
          </button>
        )}
      </div>
      {primary?.hint && <p className="hp-hint">{primary.hint}</p>}
    </div>
  );
}

export function SceneEditor() {
  const scene = useGame((s) => s.scene);
  if (scene === 'spillere') return <PlayerEditor />;
  if (scene === 'modus') return <ModeEditor />;
  if (scene === 'lag') return <TeamEditor />;
  if (scene === 'runder') return <RoundPlanEditor />;
  if (scene === 'runde') return <RoundControls />;
  return null;
}

export function PlayerEditor() {
  const s = useGame();
  const [name, setName] = useState('');
  return (
    <div className="hp-card">
      <h3>Spillere ({s.players.length} av maks {MAX_PLAYERS})</h3>
      <form
        className="hp-row"
        onSubmit={(e) => {
          e.preventDefault();
          s.addPlayer(name);
          setName('');
        }}
      >
        <input className="hp-input" placeholder="Navn på spiller" value={name} maxLength={24} onChange={(e) => setName(e.target.value)} disabled={s.players.length >= MAX_PLAYERS} />
        <button className="hp-btn gold" type="submit" disabled={!name.trim() || s.players.length >= MAX_PLAYERS}>
          + Legg til
        </button>
      </form>
      <div className="hp-list">
        {s.players.map((p, i) => (
          <div key={p.id} className="hp-item">
            <button className="emoji-btn" title="Bytt figur" onClick={() => s.setPlayerEmoji(p.id, PLAYER_EMOJIS[(PLAYER_EMOJIS.indexOf(p.emoji) + 1) % PLAYER_EMOJIS.length])}>
              {p.emoji}
            </button>
            <input className="hp-input" value={p.name} onChange={(e) => s.renamePlayer(p.id, e.target.value)} aria-label={`Navn på spiller ${i + 1}`} />
            <button className="hp-btn small" onClick={() => s.movePlayer(p.id, -1)} disabled={i === 0} aria-label="Flytt opp">
              ↑
            </button>
            <button className="hp-btn small" onClick={() => s.movePlayer(p.id, 1)} disabled={i === s.players.length - 1} aria-label="Flytt ned">
              ↓
            </button>
            <button className="hp-btn small red" onClick={() => s.removePlayer(p.id)} aria-label={`Fjern ${p.name}`}>
              ✕
            </button>
          </div>
        ))}
      </div>
      {s.players.length < MIN_PLAYERS && <p className="hp-note">Showet trenger minst {MIN_PLAYERS} spillere.</p>}
      <label className="hp-check">
        <input type="checkbox" checked={s.hostPlays} onChange={(e) => s.setHostPlays(e.target.checked)} />
        Programlederen spiller med (fasit skjules på laptopen)
      </label>
    </div>
  );
}

function ModeEditor() {
  const s = useGame();
  const sizes = suggestTeamSizes(s.players.length);
  return (
    <div className="hp-card">
      <h3>Spillmodus</h3>
      <div className="hp-row">
        <button className={`hp-btn ${s.mode === 'alle' ? 'active' : ''}`} onClick={() => s.setMode('alle')}>
          👤 Alle mot alle
        </button>
        <button className={`hp-btn ${s.mode === 'lag' ? 'active' : ''}`} onClick={() => s.setMode('lag')}>
          👥 Lagspill ({sizes.join('+')})
        </button>
      </div>
    </div>
  );
}

function TeamEditor() {
  const s = useGame();
  const nameOf = (id: string) => s.players.find((p) => p.id === id);
  return (
    <div className="hp-card">
      <h3>Lag</h3>
      <div className="hp-row">
        <button className="hp-btn gold" onClick={() => s.drawTeams()}>
          🎲 Trekk tilfeldige lag
        </button>
        <span className="hp-note">Antall lag:</span>
        {[2, 3, 4, 5].map((n) => (
          <button key={n} className={`hp-btn small ${s.teams.length === n ? 'active' : ''}`} onClick={() => s.setTeamCount(n)} disabled={n > s.players.length}>
            {n}
          </button>
        ))}
      </div>
      <p className="hp-note">Trykk på en spiller for å flytte spilleren til neste lag.</p>
      {s.teams.map((t, ti) => (
        <div key={t.id} className="team-edit" style={{ ['--team' as string]: t.color }}>
          <div className="hp-row">
            <span style={{ fontSize: 22 }}>{t.emoji}</span>
            <input className="hp-input" value={t.name} onChange={(e) => s.renameTeam(t.id, e.target.value)} aria-label="Lagnavn" />
          </div>
          <div className="members">
            {t.playerIds.map((pid) => (
              <button key={pid} className="hp-chip" onClick={() => s.movePlayerToTeam(pid, s.teams[(ti + 1) % s.teams.length].id)}>
                {nameOf(pid)?.emoji} {nameOf(pid)?.name}
              </button>
            ))}
            {t.playerIds.length === 0 && <span className="hp-note">Tomt lag</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function RoundPlanEditor() {
  const s = useGame();
  return (
    <div className="hp-card">
      <h3>Kveldens runder</h3>
      <p className="hp-note">Flere runder kommer i neste versjon. Slå av og på, og endre rekkefølgen.</p>
      {s.roundPlan.map((r, i) => {
        const def = getRound(r.type);
        if (!def) return null;
        return (
          <div key={r.id} className="hp-item">
            <label className="hp-check" style={{ flex: 1 }}>
              <input type="checkbox" checked={r.enabled} onChange={() => s.toggleRound(r.id)} />
              {def.emoji} {def.title}
            </label>
            <button className="hp-btn small" onClick={() => s.moveRound(r.id, -1)} disabled={i === 0} aria-label="Flytt opp">
              ↑
            </button>
            <button className="hp-btn small" onClick={() => s.moveRound(r.id, 1)} disabled={i === s.roundPlan.length - 1} aria-label="Flytt ned">
              ↓
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function useRoundApi(): RoundApi<unknown> {
  return {
    dispatch: (a) => useGame.getState().roundDispatch(a),
    award: (cid, delta, reason) => useGame.getState().award(cid, delta, reason),
    revoke: (id) => useGame.getState().revoke(id),
    sound: (name) => useGame.getState().playSound(name),
    fx: (e) => useGame.getState().showFx(e),
    startTimer: (ms) => useGame.getState().startTimer(ms),
    stopTimer: () => useGame.getState().pauseTimer(),
    endRound: () => useGame.getState().endRound(),
  };
}

export function RoundControls({ hideAnswers = false }: { hideAnswers?: boolean }) {
  const s = useGame();
  const api = useRoundApi();
  const def = getRound(s.roundPlan[s.roundIndex]?.type);
  if (!def || s.roundPhase !== 'spill' || s.roundState == null) return null;
  return (
    <div className="hp-card">
      <h3>
        {def.emoji} {def.title}
      </h3>
      <def.Controls state={s.roundState} ctx={roundContext(s)} api={api} showAnswers={!s.hostPlays && !hideAnswers} />
      <div className="hp-row">
        <button className="hp-btn small" onClick={() => s.endRound()}>
          ⏭ Avslutt runden nå
        </button>
      </div>
    </div>
  );
}

export function ScoreCard({ compact = false }: { compact?: boolean }) {
  const s = useGame();
  const [custom, setCustom] = useState<Record<string, string>>({});
  const contestants = contestantsOf(s);
  if (contestants.length === 0 || !s.gameId) return null;
  const rows = standings(contestants, totals(s.scoreLog, contestants));
  return (
    <div className="hp-card">
      <h3>Poeng</h3>
      <div className="hp-row">
        <button className={`hp-btn small ${s.showScoreboard ? 'active' : ''}`} onClick={() => s.toggleScoreboard()} title="S">
          📊 {s.showScoreboard ? 'Skjul poengtavla' : 'Vis poengtavla på TV'}
        </button>
        <button className="hp-btn small" onClick={() => s.undoLastScore()} disabled={s.scoreLog.length === 0}>
          ↶ Angre siste poeng
        </button>
      </div>
      <div>
        {rows.map((r) => (
          <div key={r.contestant.id} className="score-line">
            <span className="who">
              {r.place}. {r.contestant.emoji} {r.contestant.name}
            </span>
            <span className="pts">{r.score}</span>
            <div className="adj">
              {[-100, -50, 50, 100].map((d) => (
                <button key={d} className={`hp-btn small ${d < 0 ? 'red' : ''}`} onClick={() => s.award(r.contestant.id, d, 'Manuell justering', { manual: true })}>
                  {d > 0 ? `+${d}` : d}
                </button>
              ))}
              {!compact && (
                <form
                  className="hp-row"
                  style={{ flex: 1, minWidth: 140 }}
                  onSubmit={(e) => {
                    e.preventDefault();
                    const v = parseInt(custom[r.contestant.id] ?? '', 10);
                    if (!Number.isNaN(v) && v !== 0) s.award(r.contestant.id, v, 'Manuell justering', { manual: true });
                    setCustom({ ...custom, [r.contestant.id]: '' });
                  }}
                >
                  <input
                    className="hp-input"
                    style={{ minHeight: 36, fontSize: 14 }}
                    inputMode="numeric"
                    placeholder="± poeng"
                    value={custom[r.contestant.id] ?? ''}
                    onChange={(e) => setCustom({ ...custom, [r.contestant.id]: e.target.value.replace(/[^\d-]/g, '') })}
                    aria-label={`Egne poeng til ${r.contestant.name}`}
                  />
                </form>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TimerCard() {
  const s = useGame();
  const left = useTimeLeft(s.timer);
  if (s.scene !== 'runde') return null;
  const running = !!s.timer.endsAt;
  return (
    <div className="hp-card">
      <h3>Timer {s.timer.durationMs > 0 && `· ${Math.ceil(left / 1000)} sek`}</h3>
      <div className="hp-row">
        {[15, 30, 60].map((sec) => (
          <button key={sec} className="hp-btn small" onClick={() => s.startTimer(sec * 1000)}>
            ▶ {sec} sek
          </button>
        ))}
        {s.timer.durationMs > 0 && (
          <>
            <button className="hp-btn small" onClick={() => (running ? s.pauseTimer() : s.startTimer())} title="T">
              {running ? '⏸ Stopp' : '▶ Fortsett'}
            </button>
            <button className="hp-btn small" onClick={() => s.resetTimer(0)}>
              ✕ Skjul
            </button>
          </>
        )}
      </div>
    </div>
  );
}
