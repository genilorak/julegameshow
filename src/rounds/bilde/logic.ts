import { shuffle } from '../../core/id';
import { reduceMarks, type MarkAction, type Marks } from '../shared/marks';
import { PUZZLES } from './puzzles';

export const PUZZLES_PER_ROUND = 6;
export const POINTS = 100;

export interface BildeState {
  ids: string[];
  index: number;
  phase: 'sporsmal' | 'hint' | 'svar';
  marks: Marks;
}

export type BildeAction = { type: 'hint' } | { type: 'reveal' } | { type: 'next' } | { type: 'back' } | MarkAction;

export const initBilde = (rand?: () => number): BildeState => ({ ids: shuffle(PUZZLES, rand).slice(0, PUZZLES_PER_ROUND).map((p) => p.id), index: 0, phase: 'sporsmal', marks: {} });

export function reduceBilde(s: BildeState, a: BildeAction): BildeState {
  switch (a.type) {
    case 'hint':
      return { ...s, phase: 'hint' };
    case 'reveal':
      return { ...s, phase: 'svar' };
    case 'next':
      return { ...s, index: Math.min(s.ids.length, s.index + 1), phase: 'sporsmal' };
    case 'back':
      if (s.phase === 'svar') return { ...s, phase: 'hint' };
      if (s.phase === 'hint') return { ...s, phase: 'sporsmal' };
      if (s.index > 0) return { ...s, index: s.index - 1, phase: 'svar' };
      return s;
    case 'mark':
    case 'unmark':
      return { ...s, marks: reduceMarks(s.marks, s.index, a) };
  }
}
