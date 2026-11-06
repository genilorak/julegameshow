import { shuffle } from '../../core/id';
import type { RoundContext, RoundEffect } from '../types';
import { pickFair } from '../shared/fair';
import { LYN } from './questions';

export const TURN_MS = 45_000;
export const POINTS = 50;

export interface LynState {
  order: string[];
  turn: number;
  phase: 'klar' | 'spill' | 'tur-ferdig' | 'ferdig';
  /** Stokket rekkefølge på spørsmålene og hvor langt vi har kommet. */
  qs: number[];
  q: number;
  results: Record<string, { right: number; pass: number }>;
}

export type LynAction = { type: 'start' } | { type: 'right' } | { type: 'pass' } | { type: 'stop' } | { type: 'next' } | { type: 'back' };

export function initLyn(ctx: RoundContext, rand: () => number = Math.random): LynState {
  return { order: pickFair(ctx.contestants, ctx.attention, ctx.contestants.length, rand), turn: 0, phase: 'klar', qs: shuffle(LYN.map((_, i) => i), rand), q: 0, results: {} };
}

export const currentQuestion = (s: LynState) => LYN[s.qs[s.q % s.qs.length]];

function bump(s: LynState, key: 'right' | 'pass'): LynState {
  const me = s.order[s.turn];
  const r = s.results[me] ?? { right: 0, pass: 0 };
  return { ...s, q: s.q + 1, results: { ...s.results, [me]: { ...r, [key]: r[key] + 1 } } };
}

export function reduceLyn(s: LynState, a: LynAction): LynState {
  switch (a.type) {
    case 'start':
      return s.phase === 'klar' ? { ...s, phase: 'spill' } : s;
    case 'right':
      return s.phase === 'spill' ? bump(s, 'right') : s;
    case 'pass':
      return s.phase === 'spill' ? bump(s, 'pass') : s;
    case 'stop':
      return s.phase === 'spill' ? { ...s, phase: 'tur-ferdig' } : s;
    case 'next':
      if (s.phase !== 'tur-ferdig') return s;
      return s.turn + 1 < s.order.length ? { ...s, turn: s.turn + 1, phase: 'klar' } : { ...s, phase: 'ferdig' };
    case 'back':
      if (s.phase === 'tur-ferdig') return { ...s, phase: 'spill' };
      if (s.phase === 'klar' && s.turn > 0) return { ...s, turn: s.turn - 1, phase: 'tur-ferdig' };
      return s;
  }
}

export function lynEffects(a: LynAction, prev: LynState, next: LynState, ctx: RoundContext): RoundEffect[] {
  const me = prev.order[prev.turn];
  if (a.type === 'start' && next.phase === 'spill') return [{ kind: 'timer', ms: TURN_MS }, { kind: 'attention', contestantIds: [me] }, { kind: 'sound', name: 'intro' }];
  if (a.type === 'right' && next !== prev) return [{ kind: 'award', contestantId: me, delta: POINTS, reason: 'Lynrunden: riktig svar' }, { kind: 'sound', name: 'riktig' }];
  if (a.type === 'pass' && next !== prev) return [{ kind: 'sound', name: 'feil' }];
  if (a.type === 'stop' && next.phase === 'tur-ferdig') {
    const r = next.results[me]?.right ?? 0;
    const best = Math.max(0, ...prev.order.slice(0, prev.turn).map((id) => next.results[id]?.right ?? 0));
    const name = ctx.contestants.find((c) => c.id === me)?.name ?? '';
    const out: RoundEffect[] = [{ kind: 'timer', ms: null }, { kind: 'sound', name: 'tikk' }];
    if (prev.turn > 0 && r > best && r >= 4) out.push({ kind: 'fx', fx: { kind: 'leder', title: 'NY REKORD! ⚡', subtitle: `${name} med ${r} riktige` } });
    else if (r === 0) out.push({ kind: 'fx', fx: { kind: 'au', title: '😬 DEN VAR VOND.', subtitle: `Null riktige for ${name}. Nervene, kanskje?` } });
    return out;
  }
  if (a.type === 'next') return [{ kind: 'sound', name: 'whoosh' }];
  return [];
}
