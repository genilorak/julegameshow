import { shuffle } from '../../core/id';

// Snille og morsomme «hvem i familien»-spørsmål. Ingen skal føle seg uthengt.
export const HVEM_QUESTIONS: string[] = [
  'Hvem i familien ville overlevd lengst på en øde øy?',
  'Hvem er mest sannsynlig til å riste på alle gavene før julaften?',
  'Hvem ville vunnet en pepperkakehus-konkurranse?',
  'Hvem sovner først på sofaen etter julemiddagen?',
  'Hvem har den beste latteren i familien?',
  'Hvem ville klart seg best som julenisse for en dag?',
  'Hvem kjøper julegavene sine på lille julaften?',
  'Hvem synger høyest når vi går rundt juletreet?',
  'Hvem ville blitt den beste programlederen på TV?',
  'Hvem er flinkest til å finne på noe gøy når det regner?',
  'Hvem spiser mest julegodt når ingen ser?',
  'Hvem ville klart å pakke inn en sykkel så ingen gjettet hva det var?',
  'Hvem gir de klemmene som varer lengst?',
  'Hvem er mest sannsynlig til å bli kjendis?',
  'Hvem finner alltid mandelen i riskremen?',
  'Hvem ville vært best til å lure en innbruddstyv, som i Alene hjemme?',
];

export const QUESTIONS_PER_ROUND = 6;

export interface HvemState {
  ids: number[];
  index: number;
  phase: 'sporsmal' | 'pek' | 'avslor';
  /** Per spørsmål: spillerne som fikk flest stemmer. */
  chosen: Record<number, string[]>;
}

export type HvemAction = { type: 'point' } | { type: 'reveal' } | { type: 'next' } | { type: 'back' } | { type: 'choose'; playerId: string };

export const initHvem = (rand?: () => number): HvemState => ({
  ids: shuffle(HVEM_QUESTIONS.map((_, i) => i), rand).slice(0, QUESTIONS_PER_ROUND),
  index: 0,
  phase: 'sporsmal',
  chosen: {},
});

export function reduceHvem(s: HvemState, a: HvemAction): HvemState {
  switch (a.type) {
    case 'point':
      return { ...s, phase: 'pek' };
    case 'reveal':
      return { ...s, phase: 'avslor' };
    case 'next':
      return { ...s, index: Math.min(s.ids.length, s.index + 1), phase: 'sporsmal' };
    case 'back':
      if (s.phase === 'avslor') return { ...s, phase: 'pek' };
      if (s.phase === 'pek') return { ...s, phase: 'sporsmal' };
      if (s.index > 0) return { ...s, index: s.index - 1, phase: 'avslor' };
      return s;
    case 'choose': {
      const cur = s.chosen[s.index] ?? [];
      const next = cur.includes(a.playerId) ? cur.filter((x) => x !== a.playerId) : [...cur, a.playerId];
      return { ...s, chosen: { ...s.chosen, [s.index]: next } };
    }
  }
}
