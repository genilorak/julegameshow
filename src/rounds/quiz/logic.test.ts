import { describe, expect, it } from 'vitest';
import { QUIZ_QUESTIONS } from './questions';
import { pickQuestions } from './logic';

describe('julequizen', () => {
  it('har minst 20 gyldige spørsmål med unike id-er', () => {
    expect(QUIZ_QUESTIONS.length).toBeGreaterThanOrEqual(20);
    expect(new Set(QUIZ_QUESTIONS.map((q) => q.id)).size).toBe(QUIZ_QUESTIONS.length);
    for (const q of QUIZ_QUESTIONS) {
      expect(q.correct).toBeGreaterThanOrEqual(0);
      expect(q.correct).toBeLessThan(4);
      expect(new Set(q.options).size).toBe(4);
    }
  });

  it('velger spørsmål med stigende vanskelighet og uten duplikater', () => {
    const ids = pickQuestions(QUIZ_QUESTIONS, 8);
    expect(ids).toHaveLength(8);
    expect(new Set(ids).size).toBe(8);
    const diffs = ids.map((id) => QUIZ_QUESTIONS.find((q) => q.id === id)!.difficulty);
    expect([...diffs].sort()).toEqual(diffs);
    expect(diffs).toContain(3);
  });
});
