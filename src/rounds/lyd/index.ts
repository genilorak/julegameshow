import type { RoundDefinition } from '../types';
import { initLyd, lydEffects, reduceLyd, type LydAction, type LydState } from './logic';
import { LydControls, LydStage } from './LydViews';

export const lydRound: RoundDefinition<LydState, LydAction> = {
  type: 'lyd',
  title: 'Lydoppgaver',
  emoji: '🎶',
  tagline: 'Spisse ører! Hvilken julesang er dette?',
  rules: ['Du hører en kjent julemelodi uten tekst', 'Skriv navnet på sangen på lappen', 'Riktig svar gir 200 poeng'],
  minutes: 6,
  init: (_ctx, rand) => initLyd(rand),
  reduce: (s, a) => reduceLyd(s, a),
  isDone: (s) => s.index >= s.ids.length,
  primary: (s) => {
    if (s.index >= s.ids.length) return null;
    if (s.phase === 'lytt') return s.plays === 0 ? { label: 'Spill melodien', action: { type: 'play' } } : { label: 'Vis svaret', action: { type: 'reveal' } };
    return { label: s.index === s.ids.length - 1 ? 'Ferdig med lydene' : 'Neste melodi', action: { type: 'next' } };
  },
  back: (s) => (s.phase === 'svar' || s.index > 0 ? { type: 'back' } : null),
  effectsFor: (a, prev) => lydEffects(a, prev),
  Stage: LydStage,
  Controls: LydControls,
};
