import type { WagerQuestion } from './wager';

// Satserunden: kategorien vises først, så satser lagene før de ser spørsmålet.
export const WAGER_QUESTIONS: WagerQuestion[] = [
  {
    id: 's-gavle',
    category: 'Jul i Norden',
    text: 'Hvilket land har en kjempestor julebukk av halm som folk prøver å brenne ned nesten hvert år?',
    options: ['Sverige', 'Finland', 'Danmark', 'Island'],
    correct: 0,
    answer: 'Sverige',
    fact: 'Gävlebocken i Gävle. Den har brent mange ganger siden 1966.',
  },
  {
    id: 's-sinterklaas',
    category: 'Julenisser verden rundt',
    text: 'Hva heter julenissen i Nederland?',
    options: ['Père Noël', 'Sinterklaas', 'Babbo Natale', 'Joulupukki'],
    correct: 1,
    answer: 'Sinterklaas',
  },
  {
    id: 's-notteknekkeren',
    category: 'Klassisk musikk',
    text: 'Hvem komponerte balletten «Nøtteknekkeren»?',
    options: ['Mozart', 'Grieg', 'Tsjajkovskij', 'Bach'],
    correct: 2,
    answer: 'Tsjajkovskij',
  },
  {
    id: 's-krumkake',
    category: 'Julekaker',
    text: 'Hvilken julekake stekes i et jern og rulles til en kjegle mens den fortsatt er varm?',
    options: ['Sandkake', 'Krumkake', 'Fattigmann', 'Smultring'],
    correct: 1,
    answer: 'Krumkake',
  },
  {
    id: 's-island',
    category: 'Jul i Norden',
    text: 'Hvor mange julesveiner har Island ifølge tradisjonen?',
    options: ['1', '7', '9', '13'],
    correct: 3,
    answer: '13',
    fact: 'De kommer én og én de tretten siste dagene før jul.',
  },
  {
    id: 's-elf',
    category: 'Julefilmer',
    text: 'Hvilken skuespiller spiller Buddy i filmen «Elf»?',
    options: ['Jim Carrey', 'Will Ferrell', 'Adam Sandler', 'Ben Stiller'],
    correct: 1,
    answer: 'Will Ferrell',
  },
];

// Finalen: ett vanskelig spørsmål, svar på lapp.
export const FINAL_QUESTIONS: WagerQuestion[] = [
  {
    id: 'f-trettende',
    category: 'Julekalenderen',
    text: 'Hvor mange dager er det fra og med 1. juledag til og med trettendedagen?',
    answer: '13 dager',
    fact: '25.–31. desember er sju dager, og 1.–6. januar er seks.',
  },
  {
    id: 'f-vise-menn',
    category: 'Juleevangeliet',
    text: 'Hva heter de tre vise menn i den vestlige tradisjonen? Alle tre navnene må være med.',
    answer: 'Caspar, Melchior og Baltasar',
  },
  {
    id: 'f-adventskalender',
    category: 'Tradisjoner',
    text: 'I hvilket land kommer adventskalenderen fra?',
    answer: 'Tyskland',
  },
  {
    id: 'f-galdhopiggen',
    category: 'Norge',
    text: 'Hvor høy er Galdhøpiggen, Norges høyeste fjell? Svar til nærmeste hundre meter.',
    answer: 'Ca. 2500 meter (2469 m)',
  },
];
