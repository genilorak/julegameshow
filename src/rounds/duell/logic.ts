import { shuffle } from '../../core/id';
import type { RoundContext, RoundEffect } from '../types';
import { fairPairs } from '../shared/fair';

export const DUELL_PROMPTS: string[] = [
  'Ting man henger på et juletre',
  'Julesanger',
  'Slags julegodt og småkaker',
  'Ting som er røde',
  'Julefilmer',
  'Ting man finner i en julestrømpe',
  'Ord som rimer på «jul»',
  'Vinteraktiviteter',
  'Ting på julefrokostbordet',
  'Land i Europa',
  'Ting som glitrer',
  'Ting man sier når man får en dårlig gave',
  'Dyr som liker kulde',
  'Ting man tar med på hytta',
  'Desserter',
  'Navn på nisser, alver og reinsdyr',
];

export const TURN_MS = 5_000;
export const WIN_POINTS = 200;

export interface DuellState {
  pairs: Array<[string, string]>;
  prompts: number[];
  index: number;
  phase: 'presenter' | 'duell' | 'vinner' | 'ferdig';
  /** Hvem av de to (0 eller 1) som må svare nå. */
  active: 0 | 1;
  /** Antall godkjente svar i duellen. */
  count: number;
  winners: Record<number, string>;
}

export type DuellAction = { type: 'start' } | { type: 'ok' } | { type: 'out' } | { type: 'next' } | { type: 'back' } | { type: 'newPrompt' };

export function initDuell(ctx: RoundContext, rand: () => number = Math.random): DuellState {
  const n = ctx.contestants.length;
  const count = n <= 3 ? 3 : Math.min(5, n);
  return { pairs: fairPairs(ctx.contestants, ctx.attention, count, rand), prompts: shuffle(DUELL_PROMPTS.map((_, i) => i), rand), index: 0, phase: 'presenter', active: 0, count: 0, winners: {} };
}

export const promptOf = (s: DuellState, offset = 0) => DUELL_PROMPTS[s.prompts[(s.index + offset) % s.prompts.length]];

export function reduceDuell(s: DuellState, a: DuellAction): DuellState {
  switch (a.type) {
    case 'start':
      return s.phase === 'presenter' ? { ...s, phase: 'duell', active: 0, count: 0 } : s;
    case 'ok':
      return s.phase === 'duell' ? { ...s, active: s.active ? 0 : 1, count: s.count + 1 } : s;
    case 'out':
      if (s.phase !== 'duell') return s;
      return { ...s, phase: 'vinner', winners: { ...s.winners, [s.index]: s.pairs[s.index][s.active ? 0 : 1] } };
    case 'next':
      if (s.phase !== 'vinner') return s;
      return s.index + 1 < s.pairs.length ? { ...s, index: s.index + 1, phase: 'presenter', active: 0, count: 0 } : { ...s, phase: 'ferdig' };
    case 'newPrompt': {
      // Bytt kategori for denne duellen: flytt den nåværende bakerst i bunken.
      const i = s.index % s.prompts.length;
      return { ...s, prompts: [...s.prompts.slice(0, i), ...s.prompts.slice(i + 1), s.prompts[i]] };
    }
    case 'back':
      if (s.phase === 'duell') return { ...s, phase: 'presenter', count: 0, active: 0 };
      if (s.phase === 'vinner') {
        const winners = { ...s.winners };
        delete winners[s.index];
        return { ...s, phase: 'duell', winners };
      }
      return s;
  }
}

export function duellEffects(a: DuellAction, prev: DuellState, next: DuellState, ctx: RoundContext): RoundEffect[] {
  const name = (id: string) => ctx.contestants.find((c) => c.id === id)?.name ?? '';
  if (a.type === 'start' && next.phase === 'duell') return [{ kind: 'timer', ms: TURN_MS }, { kind: 'attention', contestantIds: [...prev.pairs[prev.index]] }, { kind: 'sound', name: 'drama' }];
  if (a.type === 'ok' && next !== prev) return [{ kind: 'timer', ms: TURN_MS }, { kind: 'sound', name: 'klikk' }];
  if (a.type === 'out' && next.phase === 'vinner') {
    const loser = prev.pairs[prev.index][prev.active];
    const winner = next.winners[prev.index];
    return [
      { kind: 'timer', ms: null },
      { kind: 'award', contestantId: winner, delta: WIN_POINTS, reason: `Juleduell: slo ${name(loser)}` },
      { kind: 'fx', fx: { kind: 'drama', title: 'DU ER UTE! ❌', subtitle: `${name(winner)} vinner duellen og får ${WIN_POINTS} poeng` } },
    ];
  }
  if (a.type === 'next') return [{ kind: 'sound', name: 'whoosh' }];
  return [];
}
