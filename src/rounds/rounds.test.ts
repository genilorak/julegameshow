import { describe, expect, it } from 'vitest';
import type { Contestant } from '../core/types';
import type { RoundContext, RoundEffect } from './types';
import { allRounds, getRound } from './registry';
import { initWager, reduceWager, wagerEffects } from './satsing/wager';
import { WAGER_QUESTIONS } from './satsing/questions';
import { initPakker, pakkerEffects, reducePakker } from './pakker/logic';
import { POINTS as FILM_POINTS, initFilm, pointsNow, reduceFilm } from './julefilm/logic';
import { duellEffects, initDuell, reduceDuell } from './duell/logic';
import { initLyn, lynEffects, reduceLyn } from './lyn/logic';
import { initMime, mimeEffects, reduceMime } from './mime/logic';
import { initLyd, lydEffects, reduceLyd } from './lyd/logic';
import { fairPairs, pickFair } from './shared/fair';

const mk = (n: number): Contestant[] => Array.from({ length: n }, (_, i) => ({ id: `c${i}`, name: `Deltaker ${i}`, emoji: '🎅', color: '#fff', playerIds: [`p${i}`] }));
const ctxOf = (n: number, scores: Record<string, number> = {}): RoundContext => ({ roundId: 'r', contestants: mk(n), players: [], mode: 'alle', hostPlays: false, attention: {}, scores });
const awards = (fx: RoundEffect[]) => fx.filter((e): e is Extract<RoundEffect, { kind: 'award' }> => e.kind === 'award');

describe('alle runder', () => {
  it('har unike typer og finalen sist', () => {
    const types = allRounds().map((r) => r.type);
    expect(new Set(types).size).toBe(types.length);
    expect(types).toHaveLength(11);
    expect(allRounds().filter((r) => r.fixedLast).map((r) => r.type)).toEqual(['finale']);
  });

  it.each(allRounds().map((r) => [r.type]))('%s starter riktig for 2 til 10 deltakere', (type) => {
    const def = getRound(type)!;
    for (const n of [2, 3, 4, 5, 10]) {
      const s = def.init(ctxOf(n));
      expect(def.isDone(s)).toBe(false);
    }
  });
});

describe('rettferdig fordeling', () => {
  it('velger de som har vært minst i fokus', () => {
    const c = mk(4);
    expect(pickFair(c, { c0: 3, c1: 0, c2: 2, c3: 0 }, 2).sort()).toEqual(['c1', 'c3']);
  });
  it('lager par uten at noen møter seg selv, og fordeler jevnt', () => {
    const pairs = fairPairs(mk(5), {}, 5);
    const count: Record<string, number> = {};
    for (const [a, b] of pairs) {
      expect(a).not.toBe(b);
      count[a] = (count[a] ?? 0) + 1;
      count[b] = (count[b] ?? 0) + 1;
    }
    expect(Math.max(...Object.values(count)) - Math.min(...Object.values(count))).toBeLessThanOrEqual(1);
  });
});

describe('satserunden', () => {
  it('innsatsen er begrenset til poengsummen, men minst 100', () => {
    const ctx = ctxOf(2, { c0: 300, c1: -50 });
    let s = initWager(WAGER_QUESTIONS, 1, false, () => 0.5);
    s = reduceWager(s, { type: 'bet', contestantId: 'c0', amount: 9999 }, ctx);
    s = reduceWager(s, { type: 'bet', contestantId: 'c1', amount: 9999 }, ctx);
    expect(s.bets).toEqual({ c0: 300, c1: 100 });
  });
  it('gir og tar poeng når innsatsen avsløres, lavest poengsum først', () => {
    const ctx = ctxOf(2, { c0: 300, c1: 100 });
    let s = initWager(WAGER_QUESTIONS, 1, false, () => 0.5);
    s = reduceWager(s, { type: 'bet', contestantId: 'c0', amount: 300 }, ctx);
    s = reduceWager(s, { type: 'bet', contestantId: 'c1', amount: 50 }, ctx);
    s = reduceWager(s, { type: 'right', contestantId: 'c1', right: true }, ctx);
    s = { ...s, phase: 'svar' };
    s = reduceWager(s, { type: 'next' }, ctx);
    expect(s.order).toEqual(['c1', 'c0']);
    let prev = s;
    s = reduceWager(s, { type: 'next' }, ctx);
    expect(awards(wagerEffects({ type: 'next' }, prev, s, ctx))).toMatchObject([{ contestantId: 'c1', delta: 50 }]);
    prev = s;
    s = reduceWager(s, { type: 'next' }, ctx);
    const fx = wagerEffects({ type: 'next' }, prev, s, ctx);
    expect(awards(fx)).toMatchObject([{ contestantId: 'c0', delta: -300 }]);
    expect(fx.some((e) => e.kind === 'fx' && e.fx.title === '😬 DEN VAR VOND.')).toBe(true);
  });
});

describe('mystiske julepakker', () => {
  it('stjeling flytter 100 poeng', () => {
    const ctx = ctxOf(3);
    let s = initPakker(ctx, () => 0.3);
    s = { ...s, gifts: s.gifts.map((g, i) => (i === 0 ? { kind: 'stjel' } : g)) };
    s = reducePakker(s, { type: 'pick', index: 0 }, ctx);
    const prev = s;
    s = reducePakker(s, { type: 'target', contestantId: s.order[0] === 'c1' ? 'c2' : 'c1' }, ctx);
    const a = awards(pakkerEffects({ type: 'target', contestantId: s.target! }, prev, s, ctx));
    expect(a.map((x) => x.delta).sort()).toEqual([-100, 100]);
  });
  it('bytte gir hverandres poengsum', () => {
    const ctx = ctxOf(2, { c0: 500, c1: 100 });
    let s = initPakker(ctx, () => 0.3);
    s = { ...s, order: ['c1', 'c0', 'c1', 'c0'], gifts: s.gifts.map((g, i) => (i === 0 ? { kind: 'bytt' } : g)) };
    s = reducePakker(s, { type: 'pick', index: 0 }, ctx);
    const prev = s;
    s = reducePakker(s, { type: 'target', contestantId: 'c0' }, ctx);
    const a = awards(pakkerEffects({ type: 'target', contestantId: 'c0' }, prev, s, ctx));
    expect(a).toMatchObject([{ contestantId: 'c1', delta: 400 }, { contestantId: 'c0', delta: -400 }]);
  });
});

describe('gjett julefilmen', () => {
  it('poengene synker for hvert hint', () => {
    let s = initFilm(() => 0.1);
    expect(pointsNow(s)).toBe(FILM_POINTS[0]);
    s = reduceFilm(s, { type: 'hint' });
    expect(pointsNow(s)).toBe(200);
    s = reduceFilm(reduceFilm(s, { type: 'hint' }), { type: 'hint' });
    expect(pointsNow(s)).toBe(100);
    expect(s.hints).toBe(3);
  });
  it('riktig svar avslører filmen', () => {
    const s = reduceFilm(initFilm(), { type: 'mark', contestantId: 'c0', eventId: 'e1' });
    expect(s.phase).toBe('svar');
  });
});

describe('juleduell', () => {
  it('den som ikke står fast vinner 200', () => {
    const ctx = ctxOf(4);
    let s = initDuell(ctx, () => 0.4);
    s = reduceDuell(s, { type: 'start' });
    s = reduceDuell(s, { type: 'ok' }); // nå er det spiller 2 sin tur
    const prev = s;
    s = reduceDuell(s, { type: 'out' });
    expect(s.winners[0]).toBe(s.pairs[0][0]);
    expect(awards(duellEffects({ type: 'out' }, prev, s, ctx))).toMatchObject([{ contestantId: s.pairs[0][0], delta: 200 }]);
  });
  it('har flere dueller jo flere deltakere, opptil fem', () => {
    expect(initDuell(ctxOf(2)).pairs).toHaveLength(3);
    expect(initDuell(ctxOf(4)).pairs).toHaveLength(4);
    expect(initDuell(ctxOf(10)).pairs).toHaveLength(5);
  });
});

describe('lynrunden', () => {
  it('50 poeng per riktige, og hver deltaker får én tur', () => {
    const ctx = ctxOf(3);
    let s = initLyn(ctx);
    expect(new Set(s.order).size).toBe(3);
    s = reduceLyn(s, { type: 'start' });
    const prev = s;
    s = reduceLyn(s, { type: 'right' });
    expect(awards(lynEffects({ type: 'right' }, prev, s, ctx))).toMatchObject([{ delta: 50 }]);
    s = reduceLyn(reduceLyn(s, { type: 'pass' }), { type: 'stop' });
    expect(s.results[s.order[0]]).toEqual({ right: 1, pass: 1 });
    expect(s.q).toBe(2);
  });
});

describe('mime', () => {
  it('gir poeng til både mimeren og den som gjettet', () => {
    const ctx = ctxOf(4);
    let s = initMime(ctx);
    s = reduceMime(s, { type: 'start' });
    const prev = s;
    const guesser = ctx.contestants.find((c) => c.id !== s.order[0])!.id;
    s = reduceMime(s, { type: 'guessed', guesserId: guesser });
    const a = awards(mimeEffects({ type: 'guessed', guesserId: guesser }, prev, s, ctx));
    expect(a.map((x) => x.contestantId).sort()).toEqual([s.order[0], guesser].sort());
  });
  it('samme deltaker mimer aldri to ganger på rad', () => {
    const s = initMime(ctxOf(2));
    expect(s.order).toHaveLength(4);
    for (let i = 1; i < s.order.length; i++) expect(s.order[i]).not.toBe(s.order[i - 1]);
  });
});

describe('lydoppgaver', () => {
  it('spiller melodien og stopper den ved avsløring', () => {
    let s = initLyd();
    expect(lydEffects({ type: 'play' }, s)).toEqual([{ kind: 'melody', id: s.ids[0] }]);
    s = reduceLyd(s, { type: 'play' });
    expect(lydEffects({ type: 'reveal' }, s)[0]).toEqual({ kind: 'melody', id: 'stopp' });
  });
});
