// «Hvem hadde rett?»-knapper som gir og angrer poeng. Brukes av runder der alle svarer på lapp.
import type { Contestant } from '../../core/types';
import type { RoundApi } from '../types';

export type Marks = Record<number, Record<string, string>>;

export type MarkAction = { type: 'mark'; contestantId: string; eventId: string } | { type: 'unmark'; contestantId: string };

export function reduceMarks(marks: Marks, index: number, a: MarkAction): Marks {
  const current = { ...marks[index] };
  if (a.type === 'mark') current[a.contestantId] = a.eventId;
  else delete current[a.contestantId];
  return { ...marks, [index]: current };
}

export function MarkChips<A>({
  contestants,
  marks,
  points,
  reason,
  api,
  label,
  single,
}: {
  contestants: Contestant[];
  marks: Record<string, string> | undefined;
  points: number;
  reason: string;
  api: RoundApi<A>;
  label?: string;
  /** Bare én kan få poengene (den første som svarte riktig). */
  single?: boolean;
}) {
  const m = marks ?? {};
  const toggle = (cid: string) => {
    const existing = m[cid];
    if (existing) {
      api.revoke(existing);
      api.dispatch({ type: 'unmark', contestantId: cid } as A);
      return;
    }
    if (single) {
      for (const [other, ev] of Object.entries(m)) {
        api.revoke(ev);
        api.dispatch({ type: 'unmark', contestantId: other } as A);
      }
    }
    const eventId = api.award(cid, points, reason);
    api.dispatch({ type: 'mark', contestantId: cid, eventId } as A);
  };
  return (
    <div>
      <span className="hp-label">{label ?? `Hvem hadde rett? (+${points})`}</span>
      <div className="hp-chips">
        {contestants.map((c) => (
          <button key={c.id} className={`hp-chip ${m[c.id] ? 'on' : ''}`} onClick={() => toggle(c.id)} style={{ ['--c' as string]: c.color }}>
            {c.emoji} {c.name}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Rad med vinnere som vises på TV-en etter avsløringen. */
export function WinnersStrip({ contestants, marks, points }: { contestants: Contestant[]; marks: Record<string, string> | undefined; points: number }) {
  const winners = contestants.filter((c) => marks?.[c.id]);
  if (!winners.length) return null;
  return (
    <div className="winners-strip">
      {winners.map((c) => (
        <span key={c.id} className="winner-chip pop" style={{ ['--c' as string]: c.color }}>
          {c.emoji} {c.name} +{points}
        </span>
      ))}
    </div>
  );
}
