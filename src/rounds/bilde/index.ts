import type { RoundDefinition } from '../types';
import { BildeControls, BildeStage } from './BildeViews';
import { initBilde, reduceBilde, type BildeAction, type BildeState } from './logic';

export const bildeRound: RoundDefinition<BildeState, BildeAction> = {
  type: 'bilde',
  title: 'Bildeoppgaver',
  emoji: '🧩',
  tagline: 'Emojiene forteller en historie. Hvilken?',
  rules: ['Hvert bilde skjuler en julefilm, en sang, mat eller en tradisjon', 'Skriv svaret på lappen', 'Riktig svar gir 100 poeng'],
  minutes: 6,
  init: (_ctx, rand) => initBilde(rand),
  reduce: (s, a) => reduceBilde(s, a),
  isDone: (s) => s.index >= s.ids.length,
  primary: (s) => {
    if (s.index >= s.ids.length) return null;
    if (s.phase === 'sporsmal') return { label: 'Gi et hint', action: { type: 'hint' } };
    if (s.phase === 'hint') return { label: 'Vis svaret', action: { type: 'reveal' } };
    return { label: s.index === s.ids.length - 1 ? 'Ferdig med bildene' : 'Neste bilde', action: { type: 'next' } };
  },
  back: (s) => (s.phase !== 'sporsmal' || s.index > 0 ? { type: 'back' } : null),
  soundFor: (a) => (a.type === 'hint' ? 'klikk' : a.type === 'reveal' ? 'reveal' : a.type === 'next' ? 'whoosh' : null),
  Stage: BildeStage,
  Controls: BildeControls,
};
