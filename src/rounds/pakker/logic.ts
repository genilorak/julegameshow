import { pick, shuffle } from '../../core/id';
import { QUIZ_QUESTIONS } from '../quiz/questions';
import { pickFair } from '../shared/fair';
import type { RoundContext, RoundEffect } from '../types';

export type GiftKind = 'p100' | 'p200' | 'minus100' | 'stjel' | 'dobbel' | 'utfordring' | 'bytt' | 'p50' | 'ingenting' | 'bonus';

export const GIFT_INFO: Record<GiftKind, { emoji: string; title: string; text: string; good: boolean | null }> = {
  p50: { emoji: '🎁', title: '+50 poeng', text: 'En liten, men hyggelig gave.', good: true },
  p100: { emoji: '🎁', title: '+100 poeng', text: 'Akkurat det dere ønsket dere!', good: true },
  p200: { emoji: '💰', title: '+200 poeng', text: 'Julenissen har vært raus i år.', good: true },
  minus100: { emoji: '💀', title: '−100 poeng', text: 'Kull i strømpa. Det var visst ikke snille barn her.', good: false },
  stjel: { emoji: '🎅', title: 'Stjel 100 poeng', text: 'Velg hvem dere vil rappe 100 poeng fra.', good: true },
  dobbel: { emoji: '⭐', title: 'Doble neste gevinst', text: 'Neste gang dere får poeng, dobles de.', good: true },
  bytt: { emoji: '🔄', title: 'Bytt poeng', text: 'Bytt poengsum med et annet lag. Hvis dere tør.', good: null },
  utfordring: { emoji: '🎭', title: 'Utfordring!', text: 'Klarer dere den, får dere 150 poeng.', good: null },
  ingenting: { emoji: '🤷', title: 'Ingenting', text: 'Bare luft og gavepapir. Fin innpakning, da.', good: null },
  bonus: { emoji: '🎄', title: 'Bonusspørsmål', text: 'Svar riktig og få 150 poeng.', good: null },
};

export const CHALLENGES = [
  'Syng refrenget på en julesang uten å le',
  'Gjør din beste julenisse-latter. Høyt.',
  'Nevn fem julesanger på ti sekunder',
  'Gå som et reinsdyr rundt bordet',
  'Hold en rørende takketale til juleribba',
  'Si «Glade jul» på tre forskjellige språk',
  'Etterlign en av de andre rundt bordet. De andre gjetter hvem.',
  'Pakk inn en gjenstand fra bordet i en serviett på 20 sekunder',
];

const ORDER: GiftKind[] = ['p100', 'p200', 'minus100', 'stjel', 'dobbel', 'utfordring', 'bytt', 'p50', 'ingenting', 'bonus'];

export interface Gift {
  kind: GiftKind;
  openedBy?: string;
}

export interface PakkerState {
  gifts: Gift[];
  order: string[];
  turn: number;
  phase: 'velg' | 'apnet' | 'ferdig';
  current: number | null;
  resolved: boolean;
  challenge?: string;
  bonusId?: string;
  target?: string;
}

export type PakkerAction =
  | { type: 'pick'; index: number }
  | { type: 'target'; contestantId: string }
  | { type: 'resolve'; success: boolean }
  | { type: 'next' };

export const NEEDS_TARGET: GiftKind[] = ['stjel', 'bytt'];
export const NEEDS_JUDGE: GiftKind[] = ['utfordring', 'bonus'];

export function initPakker(ctx: RoundContext, rand: () => number = Math.random): PakkerState {
  const n = ctx.contestants.length;
  const turnsEach = n <= 3 ? 2 : 1;
  const count = Math.max(6, Math.min(10, n * turnsEach + 2));
  const kinds = ORDER.slice(0, count);
  // Med bare én deltaker gir «stjel» og «bytt» ingen mening.
  const usable = n < 2 ? kinds.map((k) => (NEEDS_TARGET.includes(k) ? 'p100' : k)) : kinds;
  const order: string[] = [];
  const local = { ...ctx.attention };
  for (let t = 0; t < Math.min(count, n * turnsEach); t++) {
    const left = ctx.contestants.filter((c) => order.filter((o) => o === c.id).length < turnsEach);
    const [id] = pickFair(left, local, 1, rand);
    order.push(id);
    local[id] = (local[id] ?? 0) + 1;
  }
  return { gifts: shuffle(usable, rand).map((kind) => ({ kind })), order, turn: 0, phase: order.length ? 'velg' : 'ferdig', current: null, resolved: false };
}

export function reducePakker(s: PakkerState, a: PakkerAction, _ctx?: RoundContext, rand: () => number = Math.random): PakkerState {
  switch (a.type) {
    case 'pick': {
      const g = s.gifts[a.index];
      if (s.phase !== 'velg' || !g || g.openedBy) return s;
      const gifts = s.gifts.map((x, i) => (i === a.index ? { ...x, openedBy: s.order[s.turn] } : x));
      return {
        ...s,
        gifts,
        phase: 'apnet',
        current: a.index,
        resolved: !NEEDS_TARGET.includes(g.kind) && !NEEDS_JUDGE.includes(g.kind),
        target: undefined,
        challenge: g.kind === 'utfordring' ? pick(CHALLENGES, rand) : undefined,
        bonusId: g.kind === 'bonus' ? pick(QUIZ_QUESTIONS, rand).id : undefined,
      };
    }
    case 'target':
      if (s.phase !== 'apnet' || s.resolved || a.contestantId === s.order[s.turn]) return s;
      return { ...s, target: a.contestantId, resolved: true };
    case 'resolve':
      if (s.phase !== 'apnet' || s.resolved) return s;
      return { ...s, resolved: true };
    case 'next': {
      if (s.phase !== 'apnet') return s;
      const turn = s.turn + 1;
      const anyLeft = s.gifts.some((g) => !g.openedBy);
      return { ...s, turn, phase: turn < s.order.length && anyLeft ? 'velg' : 'ferdig', current: null, resolved: false, target: undefined, challenge: undefined, bonusId: undefined };
    }
  }
}

export function pakkerEffects(a: PakkerAction, prev: PakkerState, next: PakkerState, ctx: RoundContext): RoundEffect[] {
  const me = prev.order[prev.turn];
  const name = (id?: string) => ctx.contestants.find((c) => c.id === id)?.name ?? '';
  if (a.type === 'pick' && next.phase === 'apnet') {
    const kind = next.gifts[a.index].kind;
    const fx: RoundEffect[] = [{ kind: 'attention', contestantIds: [me] }, { kind: 'sound', name: 'reveal' }];
    const award = (delta: number, reason: string): RoundEffect => ({ kind: 'award', contestantId: me, delta, reason });
    if (kind === 'p50') fx.push(award(50, 'Julepakke: +50'));
    if (kind === 'p100') fx.push(award(100, 'Julepakke: +100'));
    if (kind === 'p200') fx.push(award(200, 'Julepakke: +200'), { kind: 'fx', fx: { kind: 'julemirakel', title: 'JULEMIRAKEL! 🎄', subtitle: `+200 til ${name(me)}` } });
    if (kind === 'minus100') fx.push(award(-100, 'Julepakke: kull i strømpa'), { kind: 'fx', fx: { kind: 'au', title: 'KULL I STRØMPA! 💀', subtitle: `−100 til ${name(me)}` } });
    if (kind === 'dobbel') fx.push({ kind: 'double', contestantId: me }, { kind: 'sound', name: 'riktig' });
    if (kind === 'ingenting') fx.push({ kind: 'sound', name: 'feil' });
    return fx;
  }
  if (a.type === 'target' && next.target) {
    const kind = prev.gifts[prev.current ?? -1]?.kind;
    if (kind === 'stjel') {
      return [
        { kind: 'award', contestantId: next.target, delta: -100, reason: `Julepakke: ${name(me)} stjal 100`, manual: true },
        { kind: 'award', contestantId: me, delta: 100, reason: `Julepakke: stjal 100 fra ${name(next.target)}`, manual: true },
        { kind: 'fx', fx: { kind: 'drama', title: 'TYVERI! 🎅', subtitle: `${name(me)} rapper 100 poeng fra ${name(next.target)}` } },
      ];
    }
    if (kind === 'bytt') {
      const mine = ctx.scores[me] ?? 0;
      const theirs = ctx.scores[next.target] ?? 0;
      const d = theirs - mine;
      const out: RoundEffect[] = [{ kind: 'fx', fx: { kind: 'drama', title: 'BYTTEHANDEL! 🔄', subtitle: `${name(me)} og ${name(next.target)} bytter poeng` } }];
      if (d !== 0) {
        out.push({ kind: 'award', contestantId: me, delta: d, reason: `Julepakke: byttet poeng med ${name(next.target)}`, manual: true });
        out.push({ kind: 'award', contestantId: next.target, delta: -d, reason: `Julepakke: byttet poeng med ${name(me)}`, manual: true });
      }
      return out;
    }
  }
  if (a.type === 'resolve' && next.resolved && !prev.resolved) {
    return a.success ? [{ kind: 'award', contestantId: me, delta: 150, reason: 'Julepakke: utfordring/bonus klart' }, { kind: 'sound', name: 'riktig' }] : [{ kind: 'sound', name: 'feil' }];
  }
  if (a.type === 'next') return [{ kind: 'sound', name: 'whoosh' }];
  return [];
}
