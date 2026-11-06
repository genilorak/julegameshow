// Innebygde julemelodier til lydrunden. Alle er gamle og fritt tilgjengelige (falt i det fri).
// Hver tone er [tone, slag]. Melodiene spilles av SoundManager med en enkel klokkelyd.

export interface Melody {
  id: string;
  title: string;
  /** Det programlederen godtar som svar. */
  accept: string;
  bpm: number;
  notes: Array<[string, number]>;
}

export const MELODIES: Melody[] = [
  {
    id: 'bjelleklang',
    title: 'Bjelleklang',
    accept: 'Bjelleklang / Jingle Bells',
    bpm: 190,
    notes: [
      ['E4', 1], ['E4', 1], ['E4', 2], ['E4', 1], ['E4', 1], ['E4', 2], ['E4', 1], ['G4', 1], ['C4', 1.5], ['D4', 0.5], ['E4', 4],
      ['F4', 1], ['F4', 1], ['F4', 1.5], ['F4', 0.5], ['F4', 1], ['E4', 1], ['E4', 1], ['E4', 0.5], ['E4', 0.5], ['E4', 1], ['D4', 1], ['D4', 1], ['E4', 1], ['D4', 2], ['G4', 2],
    ],
  },
  {
    id: 'glade-jul',
    title: 'Glade jul',
    accept: 'Glade jul / Stille natt',
    bpm: 210,
    notes: [
      ['G4', 3], ['A4', 1], ['G4', 2], ['E4', 6], ['G4', 3], ['A4', 1], ['G4', 2], ['E4', 6],
      ['D5', 4], ['D5', 2], ['B4', 6], ['C5', 4], ['C5', 2], ['G4', 6],
    ],
  },
  {
    id: 'we-wish',
    title: 'We Wish You a Merry Christmas',
    accept: 'We Wish You a Merry Christmas',
    bpm: 170,
    notes: [
      ['G4', 1], ['C5', 1], ['C5', 0.5], ['D5', 0.5], ['C5', 0.5], ['B4', 0.5], ['A4', 1], ['A4', 1], ['A4', 1],
      ['D5', 1], ['D5', 0.5], ['E5', 0.5], ['D5', 0.5], ['C5', 0.5], ['B4', 1], ['G4', 1], ['G4', 1],
      ['E5', 1], ['E5', 0.5], ['F5', 0.5], ['E5', 0.5], ['D5', 0.5], ['C5', 1], ['A4', 1], ['G4', 0.5], ['G4', 0.5], ['A4', 1], ['D5', 1], ['B4', 1], ['C5', 2],
    ],
  },
  {
    id: 'joy',
    title: 'Joy to the World',
    accept: 'Joy to the World',
    bpm: 120,
    notes: [
      ['C5', 2], ['B4', 1.5], ['A4', 0.5], ['G4', 3], ['F4', 1], ['E4', 2], ['D4', 2], ['C4', 3],
      ['G4', 1], ['A4', 3], ['A4', 1], ['B4', 3], ['B4', 1], ['C5', 4],
    ],
  },
  {
    id: 'deck',
    title: 'Deck the Halls',
    accept: 'Deck the Halls',
    bpm: 150,
    notes: [
      ['G4', 1.5], ['F4', 0.5], ['E4', 1], ['D4', 1], ['C4', 1], ['D4', 1], ['E4', 1], ['C4', 1],
      ['D4', 0.5], ['E4', 0.5], ['F4', 0.5], ['D4', 0.5], ['E4', 1.5], ['D4', 0.5], ['C4', 1], ['B3', 1], ['C4', 2],
    ],
  },
  {
    id: 'hark',
    title: 'Hark! The Herald Angels Sing',
    accept: 'Hark! The Herald Angels Sing',
    bpm: 140,
    notes: [
      ['G4', 1], ['C5', 1], ['C5', 1.5], ['B4', 0.5], ['C5', 1], ['E5', 1], ['E5', 1], ['D5', 1],
      ['G5', 1], ['G5', 1], ['G5', 1.5], ['F5', 0.5], ['E5', 1], ['D5', 1], ['E5', 2],
    ],
  },
];

export const melodyById = (id: string) => MELODIES.find((m) => m.id === id);

export const melodySeconds = (m: Melody) => (m.notes.reduce((n, [, b]) => n + b, 0) * 60) / m.bpm;
