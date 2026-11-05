import { shuffle } from '../../core/id';
import { QUIZ_QUESTIONS, type QuizQuestion } from './questions';

export interface QuizState {
  ids: string[];
  index: number;
  phase: 'sporsmal' | 'svar';
  /** Per spørsmål: hvilke deltakere som hadde rett, og poenghendelsen de fikk. */
  marks: Record<number, Record<string, string>>;
}

export type QuizAction =
  | { type: 'reveal' }
  | { type: 'next' }
  | { type: 'back' }
  | { type: 'mark'; contestantId: string; eventId: string }
  | { type: 'unmark'; contestantId: string };

export const QUESTIONS_PER_ROUND = 8;

export const questionById = (id: string): QuizQuestion | undefined => QUIZ_QUESTIONS.find((q) => q.id === id);

export const pointsFor = (q: QuizQuestion) => (q.difficulty === 3 ? 200 : 100);

/** Velger spørsmål med stigende vanskelighet: lette først, de vanskeligste til slutt. */
export function pickQuestions(pool: QuizQuestion[], count: number, rand: () => number = Math.random): string[] {
  const by = (d: number) => shuffle(pool.filter((q) => q.difficulty === d), rand);
  const easy = by(1);
  const mid = by(2);
  const hard = by(3);
  const nHard = Math.min(hard.length, Math.max(1, Math.round(count * 0.25)));
  const nMid = Math.min(mid.length, Math.round(count * 0.375));
  const nEasy = Math.min(easy.length, count - nHard - nMid);
  const chosen = [...easy.slice(0, nEasy), ...mid.slice(0, nMid), ...hard.slice(0, nHard)];
  // Fyll opp hvis en vanskelighetsgrad gikk tom.
  const rest = shuffle(pool.filter((q) => !chosen.includes(q)), rand);
  while (chosen.length < Math.min(count, pool.length)) chosen.push(rest.shift()!);
  return chosen.sort((a, b) => a.difficulty - b.difficulty).map((q) => q.id);
}

