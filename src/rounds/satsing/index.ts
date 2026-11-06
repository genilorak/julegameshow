import type { RoundDefinition } from '../types';
import { WAGER_QUESTIONS } from './questions';
import { WagerControls, WagerStage } from './WagerViews';
import { initWager, reduceWager, wagerEffects, wagerPrimary, type WagerAction, type WagerState } from './wager';

export const satsingRound: RoundDefinition<WagerState, WagerAction> = {
  type: 'satsing',
  title: 'Satserunden',
  emoji: '💰',
  tagline: 'Hvor godt kjenner dere egentlig julen?',
  rules: ['Dere får vite kategorien først', 'Sats poeng før dere ser spørsmålet', 'Riktig gir innsatsen, feil koster den'],
  minutes: 10,
  init: (_ctx, rand) => initWager(WAGER_QUESTIONS, 3, false, rand),
  reduce: reduceWager,
  isDone: (s) => s.phase === 'ferdig',
  primary: wagerPrimary,
  back: () => ({ type: 'back' }),
  effectsFor: wagerEffects,
  Stage: WagerStage,
  Controls: WagerControls,
};
