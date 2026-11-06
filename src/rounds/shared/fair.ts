import { shuffle } from '../../core/id';
import type { Contestant } from '../../core/types';

/**
 * Velger de deltakerne som har vært minst i fokus, så alle får omtrent like mye oppmerksomhet.
 * Ved likt antall avgjør tilfeldighetene.
 */
export function pickFair(contestants: Contestant[], attention: Record<string, number>, n: number, rand: () => number = Math.random): string[] {
  return shuffle(contestants, rand)
    .sort((a, b) => (attention[a.id] ?? 0) - (attention[b.id] ?? 0))
    .slice(0, n)
    .map((c) => c.id);
}

/** Lager par til dueller: de minst brukte først, og ingen møter seg selv. */
export function fairPairs(contestants: Contestant[], attention: Record<string, number>, count: number, rand: () => number = Math.random): Array<[string, string]> {
  if (contestants.length < 2) return [];
  const local = { ...attention };
  const pairs: Array<[string, string]> = [];
  for (let i = 0; i < count; i++) {
    const [a, b] = pickFair(contestants, local, 2, rand);
    pairs.push([a, b]);
    local[a] = (local[a] ?? 0) + 1;
    local[b] = (local[b] ?? 0) + 1;
  }
  return pairs;
}

export const byId = (contestants: Contestant[], id: string | undefined) => contestants.find((c) => c.id === id);
