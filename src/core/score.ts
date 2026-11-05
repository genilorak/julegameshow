// Poengmotoren. Poeng lagres som en logg av hendelser, og alt annet regnes ut fra den.
// Det gjør at angre, manuell retting og refresh alltid gir riktig stilling.
import { pick, uid } from './id';
import type { Contestant, FxEvent, ScoreEvent } from './types';

export type Totals = Record<string, number>;

export function totals(log: ScoreEvent[], contestants: Contestant[]): Totals {
  const out: Totals = Object.fromEntries(contestants.map((c) => [c.id, 0]));
  for (const e of log) if (e.contestantId in out) out[e.contestantId] += e.delta;
  return out;
}

export interface Standing {
  contestant: Contestant;
  score: number;
  /** 1 = førsteplass. Like poeng gir lik plass. */
  place: number;
}

export function standings(contestants: Contestant[], t: Totals): Standing[] {
  const sorted = contestants
    .map((c, i) => ({ c, i, score: t[c.id] ?? 0 }))
    .sort((a, b) => b.score - a.score || a.i - b.i);
  let place = 0;
  let prev: number | null = null;
  return sorted.map((row, idx) => {
    if (row.score !== prev) place = idx + 1;
    prev = row.score;
    return { contestant: row.c, score: row.score, place };
  });
}

/** Eneste leder, eller null ved delt ledelse / ingen poeng. */
export function soleLeader(t: Totals): string | null {
  const entries = Object.entries(t);
  if (entries.length < 2) return null;
  const max = Math.max(...entries.map(([, v]) => v));
  const leaders = entries.filter(([, v]) => v === max);
  return leaders.length === 1 && max > 0 ? leaders[0][0] : null;
}

export function lastPlace(t: Totals): string[] {
  const entries = Object.entries(t);
  const min = Math.min(...entries.map(([, v]) => v));
  return entries.filter(([, v]) => v === min).map(([id]) => id);
}

export interface AwardResult {
  event: ScoreEvent;
  doubled: boolean;
  doubleNext: string[];
}

/**
 * Lager en poenghendelse. Positive poeng fra spillet dobles hvis deltakeren
 * har «Doble neste poenggevinst» liggende (ikke ved manuell justering).
 */
export function makeAward(
  contestantId: string,
  delta: number,
  reason: string,
  doubleNext: string[],
  opts: { manual?: boolean; roundId?: string } = {},
): AwardResult {
  const canDouble = !opts.manual && delta > 0 && doubleNext.includes(contestantId);
  const finalDelta = canDouble ? delta * 2 : delta;
  return {
    event: {
      id: uid('p'),
      contestantId,
      delta: finalDelta,
      reason: canDouble ? `${reason} (doblet!)` : reason,
      roundId: opts.roundId,
      at: Date.now(),
    },
    doubled: canDouble,
    doubleNext: canDouble ? doubleNext.filter((id) => id !== contestantId) : doubleNext,
  };
}

const NEW_LEADER = ['🔥 VI HAR EN NY LEDER!', '🚨 DRAMA! 🚨', 'TRONSKIFTE PÅ TOPPEN!'];
const NEW_LEADER_SUB = ['{navn} tar over ledelsen', '{navn} smyger seg forbi', 'Plutselig er det {navn} som leder'];
const MIRACLE = ['JULEMIRAKEL! 🎄', 'FOR EN GAVE! 🎁'];
const OUCH = ['😬 DEN VAR VOND.', 'AU, AU, AU.', 'DET GIKK IKKE HELT SOM PLANLAGT.'];

/**
 * Ser på stillingen før og etter en endring og finner ut om det skjedde noe
 * verdt et lite TV-øyeblikk. Returnerer null når det ikke er noe å feire.
 */
export function detectDrama(
  before: Totals,
  after: Totals,
  contestants: Contestant[],
  change: { contestantId: string; delta: number },
  rand: () => number = Math.random,
): FxEvent | null {
  const name = (id: string) => contestants.find((c) => c.id === id)?.name ?? '';
  const prevLeader = soleLeader(before);
  const nextLeader = soleLeader(after);

  if (nextLeader && nextLeader !== prevLeader && Math.max(...Object.values(before)) > 0) {
    const wasLast = lastPlace(before).includes(nextLeader) && contestants.length > 2;
    if (wasLast) {
      return { id: uid('fx'), kind: 'comeback', title: 'FOR EN COMEBACK!', subtitle: `${name(nextLeader)} går fra sist til først` };
    }
    return {
      id: uid('fx'),
      kind: 'leder',
      title: pick(NEW_LEADER, rand),
      subtitle: pick(NEW_LEADER_SUB, rand).replace('{navn}', name(nextLeader)),
    };
  }
  if (change.delta >= 300) {
    return { id: uid('fx'), kind: 'julemirakel', title: pick(MIRACLE, rand), subtitle: `+${change.delta} til ${name(change.contestantId)}` };
  }
  if (change.delta <= -200) {
    return { id: uid('fx'), kind: 'au', title: pick(OUCH, rand), subtitle: `${change.delta} til ${name(change.contestantId)}` };
  }
  return null;
}
