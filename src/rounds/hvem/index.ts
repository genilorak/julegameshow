import type { RoundDefinition } from '../types';
import { HvemControls, HvemStage } from './HvemViews';
import { initHvem, reduceHvem, type HvemAction, type HvemState } from './logic';

export const hvemRound: RoundDefinition<HvemState, HvemAction> = {
  type: 'hvem',
  title: 'Hvem i familien?',
  emoji: '👉',
  tagline: 'Pek på den du tror. Alle samtidig.',
  rules: ['Jeg leser et spørsmål om oss i familien', 'På tre peker alle på den de tror', 'Ingen poeng, bare ære (og litt erting)'],
  minutes: 6,
  init: (_ctx, rand) => initHvem(rand),
  reduce: (s, a) => reduceHvem(s, a),
  isDone: (s) => s.index >= s.ids.length,
  primary: (s) => {
    if (s.index >= s.ids.length) return null;
    if (s.phase === 'sporsmal') return { label: 'Tell ned: 3, 2, 1, pek!', action: { type: 'point' } };
    if (s.phase === 'pek') return { label: 'Avslør', action: { type: 'reveal' } };
    return { label: s.index === s.ids.length - 1 ? 'Ferdig' : 'Neste spørsmål', action: { type: 'next' } };
  },
  back: (s) => (s.phase !== 'sporsmal' || s.index > 0 ? { type: 'back' } : null),
  soundFor: (a) => (a.type === 'point' ? 'trommevirvel' : a.type === 'reveal' ? 'seier' : a.type === 'next' ? 'whoosh' : null),
  Stage: HvemStage,
  Controls: HvemControls,
};
