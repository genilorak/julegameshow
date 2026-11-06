// Emoji-rebuser. `image` er satt av til ekte bilder som kan legges inn i «Rediger gameshow» senere.
export interface Puzzle {
  id: string;
  category: 'Julefilm' | 'Julesang' | 'Julemat' | 'Juletradisjon';
  emoji: string;
  answer: string;
  hint: string;
  image?: string;
}

export const PUZZLES: Puzzle[] = [
  { id: 'rudolf', category: 'Julesang', emoji: '🦌🔴👃', answer: 'Rudolf er rødnesen', hint: 'Han lyser opp veien for sleden' },
  { id: 'askepott', category: 'Julefilm', emoji: '3️⃣🌰👠', answer: 'Tre nøtter til Askepott', hint: 'Går på TV hver jul' },
  { id: 'elf', category: 'Julefilm', emoji: '🧝‍♂️🗽🍝', answer: 'Elf', hint: 'Will Ferrell i grønn drakt' },
  { id: 'polar', category: 'Julefilm', emoji: '🚂❄️🧭🎅', answer: 'Polarekspressen', hint: 'Et tog til Nordpolen' },
  { id: 'grinch', category: 'Julefilm', emoji: '💚😠🎄🐶', answer: 'Grinchen', hint: 'Han stjeler julen' },
  { id: 'grevinnen', category: 'Juletradisjon', emoji: '👵🏻🍷🐯🤵', answer: 'Grevinnen og hovmesteren', hint: 'Lille julaften på NRK' },
  { id: 'vise', category: 'Juletradisjon', emoji: '3️⃣👑👑👑⭐🐪', answer: 'De tre vise menn', hint: 'De fulgte en stjerne' },
  { id: 'riskrem', category: 'Julemat', emoji: '🍚🥛🍒', answer: 'Riskrem', hint: 'Med rød saus på toppen' },
  { id: 'ribbe', category: 'Julemat', emoji: '🐷🔥🧂🥔', answer: 'Ribbe', hint: 'Sprø svor er alt' },
  { id: 'pinnekjott', category: 'Julemat', emoji: '🐑🪵♨️', answer: 'Pinnekjøtt', hint: 'Dampes over bjørkepinner' },
  { id: 'pepperkakehus', category: 'Juletradisjon', emoji: '🌶️🍪🏠', answer: 'Pepperkakehus', hint: 'Bygges med melisglasur' },
  { id: 'advent', category: 'Juletradisjon', emoji: '🕯️🕯️🕯️🕯️📅', answer: 'Advent', hint: 'Ett lys hver søndag' },
  { id: 'stillenatt', category: 'Julesang', emoji: '🤫🌙', answer: 'Stille natt', hint: 'Kjent som «Glade jul» på norsk' },
  { id: 'snomann', category: 'Julefilm', emoji: '⛄️👦🏻✈️🌙', answer: 'Snømannen', hint: 'Animert klassiker uten ord' },
  { id: 'nissen', category: 'Julesang', emoji: '🏚️🪑🎅🏻🥣', answer: 'På låven sitter nissen', hint: 'Han spiser julegrøten sin' },
  { id: 'frost', category: 'Julefilm', emoji: '❄️👸🏼👸🏻⛄️', answer: 'Frost', hint: 'To søstre og en snømann som liker sommer' },
];

export const puzzleById = (id: string) => PUZZLES.find((p) => p.id === id);
