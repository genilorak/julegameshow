import type { RoundDefinition } from '../types';
import { DuellControls, DuellStage } from './DuellViews';
import { duellEffects, initDuell, reduceDuell, type DuellAction, type DuellState } from './logic';

export const duellRound: RoundDefinition<DuellState, DuellAction> = {
  type: 'duell',
  title: 'Juleduell',
  emoji: '⚔️',
  tagline: 'To mot to. Fem sekunder. Den som nøler, taper.',
  rules: ['To og to møtes i en kategori', 'Si én ting hver, annenhver gang, innen fem sekunder', 'Den som står fast eller gjentar noe, er ute. Vinneren får 200'],
  minutes: 7,
  init: (ctx, rand) => initDuell(ctx, rand),
  reduce: (s, a) => reduceDuell(s, a),
  isDone: (s) => s.phase === 'ferdig',
  primary: (s) => {
    if (s.phase === 'presenter') return { label: 'Start duellen', action: { type: 'start' } };
    if (s.phase === 'duell') return { label: 'Godkjent, neste', action: { type: 'ok' } };
    if (s.phase === 'vinner') return { label: s.index + 1 < s.pairs.length ? 'Neste duell' : 'Ferdig med duellene', action: { type: 'next' } };
    return null;
  },
  back: (s) => (s.phase === 'duell' || s.phase === 'vinner' ? { type: 'back' } : null),
  effectsFor: duellEffects,
  Stage: DuellStage,
  Controls: DuellControls,
};
