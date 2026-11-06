import { shuffle } from '../../core/id';
import type { RoundContext, RoundEffect } from '../types';
import { pickFair } from '../shared/fair';

export const MIME_TASKS: string[] = [
  'Pakke inn en gave som ikke vil ligge stille',
  'Rudolf med kraftig forkjølelse',
  'Bygge en snømann som stadig faller sammen',
  'Spise altfor mye ribbe',
  'Julenissen som sitter fast i pipa',
  'Gå på ski for første gang',
  'Pynte juletreet, og så velter det',
  'Åpne en gave du absolutt ikke liker, men må late som du elsker',
  'Lete etter mandelen i riskremen',
  'Henge opp julelys og få strøm i fingrene',
  'Skøyter på glatt is',
  'Bake pepperkaker og brenne dem',
  'Kjøre slede med åtte ville reinsdyr',
  'Danse rundt juletreet helt alene',
  'Prøve å holde seg våken for å se julenissen',
  'Snøballkrig mot en usynlig fiende',
  'Steke lutefisk og kjenne lukta',
  'Bære hjem et altfor stort juletre',
  'Synge i kor og glemme teksten',
  'En pingvin på julebord',
  'Strikke et julegenser i full fart',
  'Lage en engel i snøen',
  'Grevinnen og hovmesteren: snuble i tigerskinnet',
  'Prøve å få en katt til å bruke nisselue',
];

export const TURN_MS = 45_000;
export const POINTS = 100;

export interface MimeState {
  order: string[];
  turn: number;
  phase: 'klar' | 'mimer' | 'resultat' | 'ferdig';
  tasks: number[];
  /** Peker i oppgavebunken (øker ved hver ny oppgave). */
  t: number;
  results: Record<number, { guessed: boolean; guesser?: string | null }>;
}

export type MimeAction =
  | { type: 'start' }
  | { type: 'skip' }
  | { type: 'guessed'; guesserId: string | null }
  | { type: 'timeout' }
  | { type: 'next' }
  | { type: 'back' };

export function initMime(ctx: RoundContext, rand: () => number = Math.random): MimeState {
  const n = ctx.contestants.length;
  const turns = n <= 3 ? n * 2 : n;
  const order: string[] = [];
  const local = { ...ctx.attention };
  while (order.length < turns) {
    const [id] = pickFair(ctx.contestants.filter((c) => c.id !== order[order.length - 1]), local, 1, rand);
    order.push(id);
    local[id] = (local[id] ?? 0) + 1;
  }
  return { order, turn: 0, phase: 'klar', tasks: shuffle(MIME_TASKS.map((_, i) => i), rand), t: 0, results: {} };
}

export const taskOf = (s: MimeState) => MIME_TASKS[s.tasks[s.t % s.tasks.length]];

export function reduceMime(s: MimeState, a: MimeAction): MimeState {
  switch (a.type) {
    case 'start':
      return s.phase === 'klar' ? { ...s, phase: 'mimer' } : s;
    case 'skip':
      return s.phase === 'klar' || s.phase === 'mimer' ? { ...s, t: s.t + 1 } : s;
    case 'guessed':
      return s.phase === 'mimer' ? { ...s, phase: 'resultat', results: { ...s.results, [s.turn]: { guessed: true, guesser: a.guesserId } } } : s;
    case 'timeout':
      return s.phase === 'mimer' ? { ...s, phase: 'resultat', results: { ...s.results, [s.turn]: { guessed: false } } } : s;
    case 'next':
      if (s.phase !== 'resultat') return s;
      return s.turn + 1 < s.order.length ? { ...s, turn: s.turn + 1, t: s.t + 1, phase: 'klar' } : { ...s, phase: 'ferdig' };
    case 'back':
      if (s.phase === 'mimer') return { ...s, phase: 'klar' };
      return s;
  }
}

export function mimeEffects(a: MimeAction, prev: MimeState, next: MimeState, ctx: RoundContext): RoundEffect[] {
  const me = prev.order[prev.turn];
  const name = (id?: string | null) => ctx.contestants.find((c) => c.id === id)?.name ?? '';
  if (a.type === 'start' && next.phase === 'mimer') return [{ kind: 'timer', ms: TURN_MS }, { kind: 'attention', contestantIds: [me] }, { kind: 'sound', name: 'intro' }];
  if (a.type === 'back' && prev.phase === 'mimer') return [{ kind: 'timer', ms: null }];
  if (a.type === 'guessed' && next.phase === 'resultat') {
    const out: RoundEffect[] = [{ kind: 'timer', ms: null }, { kind: 'sound', name: 'riktig' }, { kind: 'award', contestantId: me, delta: POINTS, reason: 'Mime: oppgaven ble gjettet' }];
    if (a.guesserId && a.guesserId !== me) out.push({ kind: 'award', contestantId: a.guesserId, delta: POINTS, reason: `Mime: gjettet ${name(me)} sin oppgave` });
    return out;
  }
  if (a.type === 'timeout' && next.phase === 'resultat') return [{ kind: 'timer', ms: null }, { kind: 'fx', fx: { kind: 'tid', title: 'TIDEN ER UTE! ⏰', subtitle: 'Ingen poeng denne gangen' } }];
  if (a.type === 'next') return [{ kind: 'sound', name: 'whoosh' }];
  return [];
}
