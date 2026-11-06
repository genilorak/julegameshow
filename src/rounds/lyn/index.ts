import type { RoundDefinition } from '../types';
import { initLyn, lynEffects, reduceLyn, type LynAction, type LynState } from './logic';
import { LynControls, LynStage } from './LynViews';

export const lynRound: RoundDefinition<LynState, LynAction> = {
  type: 'lyn',
  title: 'Lynrunden',
  emoji: '⚡',
  tagline: '45 sekunder. Ingen tid til å tenke.',
  rules: ['Én og én får 45 sekunder', 'Svar på så mange spørsmål du rekker', 'Hvert riktige svar gir 50 poeng. Si «pass» hvis du står fast'],
  minutes: 8,
  init: (ctx, rand) => initLyn(ctx, rand),
  reduce: (s, a) => reduceLyn(s, a),
  isDone: (s) => s.phase === 'ferdig',
  primary: (s) => {
    const last = s.turn + 1 >= s.order.length;
    if (s.phase === 'klar') return { label: 'Start turen', action: { type: 'start' } };
    if (s.phase === 'spill') return { label: 'Riktig (+50)', action: { type: 'right' } };
    if (s.phase === 'tur-ferdig') return { label: last ? 'Se resultatene' : 'Neste deltaker', action: { type: 'next' } };
    return null;
  },
  back: (s) => (s.phase === 'tur-ferdig' || (s.phase === 'klar' && s.turn > 0) ? { type: 'back' } : null),
  effectsFor: lynEffects,
  Stage: LynStage,
  Controls: LynControls,
};
