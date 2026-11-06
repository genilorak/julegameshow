// Felles motor for alt som handler om å satse poeng: satserunden og finalen.
import { shuffle } from '../../core/id';
import type { RoundContext, RoundEffect } from '../types';

export interface WagerQuestion {
  id: string;
  category: string;
  text: string;
  /** Flervalg (A–D). Uten alternativer skriver lagene svaret på lapp. */
  options?: [string, string, string, string];
  correct?: number;
  answer: string;
  fact?: string;
}

export type WagerPhase = 'stilling' | 'start' | 'kategori' | 'innsats' | 'sporsmal' | 'svar' | 'avslor' | 'ferdig';

export interface WagerState {
  finale: boolean;
  ids: string[];
  index: number;
  phase: WagerPhase;
  bets: Record<string, number>;
  right: Record<string, boolean>;
  /** Rekkefølgen innsatsene avsløres i (lavest poengsum først). */
  order: string[];
  revealed: number;
}

export type WagerAction =
  | { type: 'next' }
  | { type: 'back' }
  | { type: 'bet'; contestantId: string; amount: number }
  | { type: 'right'; contestantId: string; right: boolean };

/** Hvor mye en deltaker kan satse: alt de har, men alltid minst 100 så alle kan være med. */
export const maxBet = (score: number) => Math.max(100, score);

export const BET_STEPS = [0, 50, 100, 200, 400];

export function initWager(pool: WagerQuestion[], count: number, finale: boolean, rand: () => number = Math.random): WagerState {
  return {
    finale,
    ids: shuffle(pool, rand)
      .slice(0, count)
      .map((q) => q.id),
    index: 0,
    phase: finale ? 'stilling' : 'kategori',
    bets: {},
    right: {},
    order: [],
    revealed: 0,
  };
}

const FLOW: WagerPhase[] = ['stilling', 'start', 'kategori', 'innsats', 'sporsmal', 'svar', 'avslor'];

export function reduceWager(s: WagerState, a: WagerAction, ctx: RoundContext): WagerState {
  switch (a.type) {
    case 'bet': {
      const max = maxBet(ctx.scores[a.contestantId] ?? 0);
      return { ...s, bets: { ...s.bets, [a.contestantId]: Math.max(0, Math.min(max, Math.round(a.amount))) } };
    }
    case 'right':
      return { ...s, right: { ...s.right, [a.contestantId]: a.right } };
    case 'back': {
      if (s.phase === 'avslor' && s.revealed > 0) return s; // Poeng er allerede gitt; angre via poengpanelet.
      const i = FLOW.indexOf(s.phase);
      const first = s.finale ? 0 : 2;
      return i > first ? { ...s, phase: FLOW[i - 1] } : s;
    }
    case 'next': {
      if (s.phase === 'svar') {
        const order = [...ctx.contestants].sort((x, y) => (ctx.scores[x.id] ?? 0) - (ctx.scores[y.id] ?? 0)).map((c) => c.id);
        return { ...s, phase: 'avslor', order, revealed: 0 };
      }
      if (s.phase === 'avslor') {
        if (s.revealed < s.order.length) return { ...s, revealed: s.revealed + 1 };
        if (s.index + 1 < s.ids.length) return { ...s, index: s.index + 1, phase: 'kategori', bets: {}, right: {}, order: [], revealed: 0 };
        return { ...s, phase: 'ferdig' };
      }
      const i = FLOW.indexOf(s.phase);
      return i >= 0 && i < FLOW.length - 1 ? { ...s, phase: FLOW[i + 1] } : s;
    }
  }
}

export function wagerPrimary(s: WagerState): { label: string; action: WagerAction } | null {
  const next = { type: 'next' } as const;
  switch (s.phase) {
    case 'stilling':
      return { label: 'Finalen starter nå!', action: next };
    case 'start':
      return { label: 'Vis kategorien', action: next };
    case 'kategori':
      return { label: 'Ta imot innsatser', action: next };
    case 'innsats':
      return { label: 'Vis spørsmålet', action: next };
    case 'sporsmal':
      return { label: 'Vis svaret', action: next };
    case 'svar':
      return { label: 'Avslør innsatsene', action: next };
    case 'avslor':
      if (s.revealed < s.order.length) return { label: s.revealed === s.order.length - 1 ? 'Avslør den siste' : 'Avslør neste innsats', action: next };
      if (s.index + 1 < s.ids.length) return { label: 'Neste spørsmål', action: next };
      return { label: s.finale ? 'Ferdig med finalen' : 'Ferdig med runden', action: next };
    case 'ferdig':
      return null;
  }
}

export function wagerEffects(a: WagerAction, prev: WagerState, next: WagerState, ctx: RoundContext): RoundEffect[] {
  const name = (id: string) => ctx.contestants.find((c) => c.id === id)?.name ?? '';
  if (a.type === 'bet') {
    const score = ctx.scores[a.contestantId] ?? 0;
    if (score > 0 && next.bets[a.contestantId] === score && prev.bets[a.contestantId] !== score) {
      return [{ kind: 'fx', fx: { kind: 'allin', title: 'DETTE KAN GÅ VELDIG GALT.', subtitle: `${name(a.contestantId)} satser ALT` } }, { kind: 'sound', name: 'drama' }];
    }
    return [{ kind: 'sound', name: 'klikk' }];
  }
  if (a.type === 'next' && prev.phase === 'avslor' && next.revealed === prev.revealed + 1) {
    const id = next.order[next.revealed - 1];
    const bet = next.bets[id] ?? 0;
    if (!bet) return [{ kind: 'sound', name: 'reveal' }];
    const right = !!next.right[id];
    const effects: RoundEffect[] = [{ kind: 'award', contestantId: id, delta: right ? bet : -bet, reason: `${next.finale ? 'Finale' : 'Satserunden'}: ${right ? 'riktig' : 'feil'} med ${bet} i innsats` }];
    const score = ctx.scores[id] ?? 0;
    if (!right && score > 0 && bet >= score) effects.push({ kind: 'fx', fx: { kind: 'au', title: '😬 DEN VAR VOND.', subtitle: `${name(id)} satset alt og tapte alt` } });
    return effects;
  }
  if (a.type === 'next' && next.phase === 'start') return [{ kind: 'sound', name: 'finale' }];
  if (a.type === 'next' && next.phase === 'avslor' && prev.phase === 'svar') return [{ kind: 'sound', name: 'trommevirvel' }];
  if (a.type === 'next' && next.phase === 'svar') return [{ kind: 'sound', name: 'reveal' }];
  return [];
}
