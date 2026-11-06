import type { RoundDefinition } from '../types';
import { initPakker, pakkerEffects, reducePakker, type PakkerAction, type PakkerState } from './logic';
import { PakkerControls, PakkerStage } from './PakkerViews';

export const pakkerRound: RoundDefinition<PakkerState, PakkerAction> = {
  type: 'pakker',
  title: 'Mystiske julepakker',
  emoji: '🎁',
  tagline: 'Noen pakker er gull verdt. Andre inneholder kull.',
  rules: ['Velg en pakke ved å rope nummeret', 'Den kan gi poeng, ta poeng eller stjele poeng', 'Ingen vet hva som er i hvilken'],
  minutes: 8,
  init: (ctx, rand) => initPakker(ctx, rand),
  reduce: (s, a, ctx) => reducePakker(s, a, ctx),
  isDone: (s) => s.phase === 'ferdig',
  primary: (s) => {
    if (s.phase === 'apnet' && s.resolved) return { label: s.turn + 1 < s.order.length ? 'Neste tur' : 'Ferdig med pakkene', action: { type: 'next' } };
    return null;
  },
  effectsFor: pakkerEffects,
  Stage: PakkerStage,
  Controls: PakkerControls,
};
