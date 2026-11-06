import type { RoundDefinition } from '../types';
import { initMime, mimeEffects, reduceMime, type MimeAction, type MimeState } from './logic';
import { MimeControls, MimeStage } from './MimeViews';

export const mimeRound: RoundDefinition<MimeState, MimeAction> = {
  type: 'mime',
  title: 'Mime',
  emoji: '🎭',
  tagline: 'Ingen ord. Ingen lyder. Bare innlevelse.',
  rules: ['Mimeren ser oppgaven i hemmelighet', 'Du har 45 sekunder på å få de andre til å gjette', 'Gjettet? 100 poeng til mimeren og den som gjettet'],
  minutes: 10,
  init: (ctx, rand) => initMime(ctx, rand),
  reduce: (s, a) => reduceMime(s, a),
  isDone: (s) => s.phase === 'ferdig',
  primary: (s) => {
    if (s.phase === 'klar') return { label: 'Start klokka', action: { type: 'start' } };
    if (s.phase === 'resultat') return { label: s.turn + 1 < s.order.length ? 'Neste mimer' : 'Ferdig med mime', action: { type: 'next' } };
    return null;
  },
  back: (s) => (s.phase === 'mimer' ? { type: 'back' } : null),
  effectsFor: mimeEffects,
  Stage: MimeStage,
  Controls: MimeControls,
};
