import type { RoundDefinition } from '../types';
import { FilmControls, FilmStage } from './FilmViews';
import { initFilm, reduceFilm, type FilmAction, type FilmState } from './logic';

export const julefilmRound: RoundDefinition<FilmState, FilmAction> = {
  type: 'julefilm',
  title: 'Gjett julefilmen',
  emoji: '🎬',
  tagline: 'Tre hint. Jo færre du trenger, jo flere poeng.',
  rules: ['Rop ut svaret så snart du vet det', 'Første hint gir 300 poeng, så 200, så 100', 'Feil svar? Da er du ute for den filmen'],
  minutes: 8,
  init: (_ctx, rand) => initFilm(rand),
  reduce: (s, a) => reduceFilm(s, a),
  isDone: (s) => s.index >= s.ids.length,
  primary: (s) => {
    if (s.index >= s.ids.length) return null;
    if (s.phase === 'hint') return s.hints < 3 ? { label: 'Neste hint', action: { type: 'hint' } } : { label: 'Vis svaret', action: { type: 'reveal' } };
    return { label: s.index === s.ids.length - 1 ? 'Ferdig med filmene' : 'Neste film', action: { type: 'next' } };
  },
  back: (s) => (s.phase === 'svar' || s.hints > 1 || s.index > 0 ? { type: 'back' } : null),
  soundFor: (a) => (a.type === 'hint' ? 'klikk' : a.type === 'reveal' ? 'reveal' : a.type === 'next' ? 'whoosh' : a.type === 'mark' ? 'riktig' : null),
  Stage: FilmStage,
  Controls: FilmControls,
};
