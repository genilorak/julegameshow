import { motion } from 'framer-motion';
import { AnimatedNumber } from '../design/AnimatedNumber';
import { soleLeader, standings, totals } from '../core/score';
import { contestantsOf } from '../core/teams';
import type { Contestant, GameState, Player } from '../core/types';

/**
 * Poengtavla. Radene sorteres etter plassering og glir på plass når stillingen endres.
 * Størrelsen tilpasser seg 2–10 deltakere, så den alltid fyller skjermen pent.
 */
export function Scoreboard({ game }: { game: GameState }) {
  const contestants = contestantsOf(game);
  return (
    <ScoreboardView
      contestants={contestants}
      scores={totals(game.scoreLog, contestants)}
      players={game.players}
      showMembers={game.mode === 'lag'}
      doubleNext={game.effects.doubleNext}
    />
  );
}

export function ScoreboardView({
  contestants,
  scores: t,
  players,
  showMembers,
  doubleNext = [],
}: {
  contestants: Contestant[];
  scores: Record<string, number>;
  players: Player[];
  showMembers: boolean;
  doubleNext?: string[];
}) {
  const rows = standings(contestants, t);
  const leaderId = soleLeader(t);
  const n = Math.max(rows.length, 1);
  const rowH = Math.min(150, Math.floor((700 - (n - 1) * 14) / n));
  const fs = Math.round(rowH * 0.42);
  const max = Math.max(1, ...rows.map((r) => r.score));
  const nameOf = (id: string) => players.find((p) => p.id === id)?.name;

  return (
    <div className="scoreboard" style={{ ['--row-h' as string]: `${rowH}px`, ['--fs' as string]: `${fs}px`, ['--gap' as string]: '14px' }}>
      {rows.map((r) => {
        const leader = r.contestant.id === leaderId;
        return (
          <motion.div
            layout
            key={r.contestant.id}
            className={`score-row ${leader ? 'leader' : ''}`}
            style={{ ['--c' as string]: r.contestant.color }}
            transition={{ layout: { type: 'spring', stiffness: 120, damping: 20 } }}
          >
            <div className="bar" style={{ width: `${Math.max(6, (Math.max(0, r.score) / max) * 100)}%` }} />
            <span className="place">{leader ? '👑' : r.place}</span>
            <span className="emoji">{r.contestant.emoji}</span>
            <span className="who">
              <span className="n">{r.contestant.name}</span>
              {showMembers && rowH >= 90 && <span className="members">{r.contestant.playerIds.map(nameOf).filter(Boolean).join(' · ')}</span>}
            </span>
            {doubleNext.includes(r.contestant.id) && <span className="double-tag">⭐ Dobbel neste</span>}
            <span className="pts">
              <AnimatedNumber value={r.score} />
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
