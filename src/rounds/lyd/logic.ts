import { shuffle } from '../../core/id';
import { MELODIES } from '../../sound/melodies';
import type { RoundEffect } from '../types';
import { reduceMarks, type MarkAction, type Marks } from '../shared/marks';

export const SONGS_PER_ROUND = 5;
export const POINTS = 200;

export interface LydState {
  ids: string[];
  index: number;
  phase: 'lytt' | 'svar';
  /** Antall ganger melodien er spilt av (for å vise «spiller nå» på TV-en). */
  plays: number;
  playing: boolean;
  marks: Marks;
}

export type LydAction = { type: 'play' } | { type: 'stop' } | { type: 'reveal' } | { type: 'next' } | { type: 'back' } | MarkAction;

export const initLyd = (rand?: () => number): LydState => ({ ids: shuffle(MELODIES, rand).slice(0, SONGS_PER_ROUND).map((m) => m.id), index: 0, phase: 'lytt', plays: 0, playing: false, marks: {} });

export function reduceLyd(s: LydState, a: LydAction): LydState {
  switch (a.type) {
    case 'play':
      return { ...s, plays: s.plays + 1, playing: true };
    case 'stop':
      return { ...s, playing: false };
    case 'reveal':
      return { ...s, phase: 'svar', playing: false };
    case 'next':
      return { ...s, index: Math.min(s.ids.length, s.index + 1), phase: 'lytt', plays: 0, playing: false };
    case 'back':
      if (s.phase === 'svar') return { ...s, phase: 'lytt' };
      if (s.index > 0) return { ...s, index: s.index - 1, phase: 'svar', playing: false };
      return s;
    case 'mark':
    case 'unmark':
      return { ...s, marks: reduceMarks(s.marks, s.index, a) };
  }
}

export function lydEffects(a: LydAction, prev: LydState): RoundEffect[] {
  if (a.type === 'play') return [{ kind: 'melody', id: prev.ids[prev.index] }];
  if (a.type === 'stop') return [{ kind: 'melody', id: 'stopp' }];
  if (a.type === 'reveal') return prev.playing ? [{ kind: 'melody', id: 'stopp' }, { kind: 'sound', name: 'reveal' }] : [{ kind: 'sound', name: 'reveal' }];
  if (a.type === 'next' || a.type === 'back') return prev.playing ? [{ kind: 'melody', id: 'stopp' }] : [];
  return [];
}
