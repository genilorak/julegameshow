import type { RoundDefinition } from '../types';
import { QUIZ_QUESTIONS } from './questions';
import { QuizControls } from './QuizControls';
import { QuizStage } from './QuizStage';
import { QUESTIONS_PER_ROUND, pickQuestions, type QuizAction, type QuizState } from './logic';

export const quizRound: RoundDefinition<QuizState, QuizAction> = {
  type: 'julequiz',
  title: 'Den store julequizen',
  emoji: '🎄',
  tagline: 'Kunnskap, nisser og en god porsjon flaks',
  rules: [
    'Alle svarer på hvert spørsmål, på lapp',
    'Riktig svar gir 100 poeng, de vanskeligste 200',
    'Spørsmålene blir vanskeligere utover',
  ],
  minutes: 12,

  init: (_ctx, rand) => ({ ids: pickQuestions(QUIZ_QUESTIONS, QUESTIONS_PER_ROUND, rand), index: 0, phase: 'sporsmal', marks: {} }),

  reduce: (s, a) => {
    switch (a.type) {
      case 'reveal':
        return { ...s, phase: 'svar' };
      case 'next':
        return { ...s, index: Math.min(s.ids.length, s.index + 1), phase: 'sporsmal' };
      case 'back':
        if (s.phase === 'svar') return { ...s, phase: 'sporsmal' };
        if (s.index > 0) return { ...s, index: s.index - 1, phase: 'svar' };
        return s;
      case 'mark':
        return { ...s, marks: { ...s.marks, [s.index]: { ...s.marks[s.index], [a.contestantId]: a.eventId } } };
      case 'unmark': {
        const current = { ...s.marks[s.index] };
        delete current[a.contestantId];
        return { ...s, marks: { ...s.marks, [s.index]: current } };
      }
    }
  },

  isDone: (s) => s.index >= s.ids.length,

  primary: (s) => {
    if (s.index >= s.ids.length) return null;
    if (s.phase === 'sporsmal') return { label: 'Vis svar', action: { type: 'reveal' } };
    return { label: s.index === s.ids.length - 1 ? 'Ferdig med quizen' : 'Neste spørsmål', action: { type: 'next' } };
  },

  back: (s) => (s.phase === 'svar' || s.index > 0 ? { type: 'back' } : null),

  soundFor: (a) => (a.type === 'reveal' ? 'reveal' : a.type === 'next' ? 'whoosh' : null),

  Stage: QuizStage,
  Controls: QuizControls,
};
