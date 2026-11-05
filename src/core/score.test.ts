import { describe, expect, it } from 'vitest';
import { detectDrama, makeAward, soleLeader, standings, totals } from './score';
import type { Contestant, ScoreEvent } from './types';

const c = (id: string): Contestant => ({ id, name: id.toUpperCase(), emoji: '⭐', color: '#fff', playerIds: [id] });
const A = c('a'), B = c('b'), C = c('c');
const ev = (contestantId: string, delta: number): ScoreEvent => ({ id: Math.random().toString(), contestantId, delta, reason: '', at: 0 });

describe('poengmotor', () => {
  it('summerer positive og negative poeng', () => {
    const t = totals([ev('a', 100), ev('a', -150), ev('b', 50)], [A, B]);
    expect(t).toEqual({ a: -50, b: 50 });
  });

  it('ignorerer poeng til deltakere som er fjernet', () => {
    expect(totals([ev('x', 100)], [A])).toEqual({ a: 0 });
  });

  it('gir lik plass ved like poeng', () => {
    const rows = standings([A, B, C], { a: 100, b: 100, c: 20 });
    expect(rows.map((r) => r.place)).toEqual([1, 1, 3]);
  });

  it('finner bare én leder når den er alene på toppen', () => {
    expect(soleLeader({ a: 100, b: 100 })).toBeNull();
    expect(soleLeader({ a: 0, b: 0 })).toBeNull();
    expect(soleLeader({ a: 120, b: 100 })).toBe('a');
  });

  it('dobler neste gevinst én gang, men ikke manuell justering', () => {
    const first = makeAward('a', 100, 'quiz', ['a']);
    expect(first.event.delta).toBe(200);
    expect(first.doubleNext).toEqual([]);
    const manual = makeAward('a', 100, 'manuell', ['a'], { manual: true });
    expect(manual.event.delta).toBe(100);
    expect(manual.doubleNext).toEqual(['a']);
    const negative = makeAward('a', -100, 'feil', ['a']);
    expect(negative.event.delta).toBe(-100);
  });

  it('melder ny leder, comeback og store gevinster', () => {
    const rand = () => 0;
    expect(detectDrama({ a: 100, b: 50, c: 80 }, { a: 100, b: 150, c: 80 }, [A, B, C], { contestantId: 'b', delta: 100 }, rand)?.kind).toBe('comeback');
    expect(detectDrama({ a: 100, b: 90, c: 0 }, { a: 100, b: 190, c: 0 }, [A, B, C], { contestantId: 'b', delta: 100 }, rand)?.kind).toBe('leder');
    expect(detectDrama({ a: 0, b: 0 }, { a: 400, b: 0 }, [A, B], { contestantId: 'a', delta: 400 }, rand)?.kind).toBe('julemirakel');
    expect(detectDrama({ a: 100, b: 0 }, { a: 100, b: 50 }, [A, B], { contestantId: 'b', delta: 50 }, rand)).toBeNull();
    // Bryter delt ledelse
    expect(detectDrama({ a: 100, b: 100, c: 0 }, { a: 100, b: 200, c: 0 }, [A, B, C], { contestantId: 'b', delta: 100 }, rand)?.kind).toBe('leder');
    // Første poeng i spillet er ikke drama
    expect(detectDrama({ a: 0, b: 0, c: 0 }, { a: 100, b: 0, c: 0 }, [A, B, C], { contestantId: 'a', delta: 100 }, rand)).toBeNull();
  });
});
