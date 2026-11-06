import { shuffle } from '../../core/id';
import { reduceMarks, type MarkAction, type Marks } from '../shared/marks';
import { FILMS } from './films';

export const FILMS_PER_ROUND = 6;
export const POINTS = [300, 200, 100];

export interface FilmState {
  ids: string[];
  index: number;
  /** Hvor mange hint som vises (1–3). */
  hints: number;
  phase: 'hint' | 'svar';
  /** Hvem som har gjettet feil på denne filmen (er ute). */
  out: Record<number, string[]>;
  marks: Marks;
}

export type FilmAction = { type: 'hint' } | { type: 'reveal' } | { type: 'next' } | { type: 'back' } | { type: 'wrong'; contestantId: string } | MarkAction;

export const pointsNow = (s: FilmState) => POINTS[Math.min(2, Math.max(0, s.hints - 1))];

export const initFilm = (rand?: () => number): FilmState => ({ ids: shuffle(FILMS, rand).slice(0, FILMS_PER_ROUND).map((f) => f.id), index: 0, hints: 1, phase: 'hint', out: {}, marks: {} });

export function reduceFilm(s: FilmState, a: FilmAction): FilmState {
  switch (a.type) {
    case 'hint':
      return { ...s, hints: Math.min(3, s.hints + 1) };
    case 'reveal':
      return { ...s, phase: 'svar' };
    case 'next':
      return { ...s, index: Math.min(s.ids.length, s.index + 1), hints: 1, phase: 'hint' };
    case 'back':
      if (s.phase === 'svar') return { ...s, phase: 'hint' };
      if (s.hints > 1) return { ...s, hints: s.hints - 1 };
      if (s.index > 0) return { ...s, index: s.index - 1, hints: 3, phase: 'svar' };
      return s;
    case 'wrong': {
      const cur = s.out[s.index] ?? [];
      const next = cur.includes(a.contestantId) ? cur.filter((x) => x !== a.contestantId) : [...cur, a.contestantId];
      return { ...s, out: { ...s.out, [s.index]: next } };
    }
    case 'mark':
    case 'unmark': {
      const marks = reduceMarks(s.marks, s.index, a);
      // Riktig svar avslører filmen med en gang.
      return { ...s, marks, phase: a.type === 'mark' ? 'svar' : s.phase };
    }
  }
}
