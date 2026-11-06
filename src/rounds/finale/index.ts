import type { RoundDefinition } from '../types';
import { FINAL_QUESTIONS } from '../satsing/questions';
import { WagerControls, WagerStage } from '../satsing/WagerViews';
import { initWager, reduceWager, wagerEffects, wagerPrimary, type WagerAction, type WagerState } from '../satsing/wager';

export const finaleRound: RoundDefinition<WagerState, WagerAction> = {
  type: 'finale',
  title: 'Finalen',
  emoji: '🏆',
  tagline: 'Ett spørsmål. Hemmelig innsats. Alt kan skje.',
  rules: ['Alle får ett vanskelig spørsmål', 'Sats hemmelig på lapp før dere hører det', 'Svarene avsløres fra sisteplass og opp'],
  minutes: 8,
  fixedLast: true,
  init: (_ctx, rand) => initWager(FINAL_QUESTIONS, 1, true, rand),
  reduce: reduceWager,
  isDone: (s) => s.phase === 'ferdig',
  primary: wagerPrimary,
  back: () => ({ type: 'back' }),
  effectsFor: wagerEffects,
  Stage: WagerStage,
  Controls: WagerControls,
};
