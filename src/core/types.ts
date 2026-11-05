// Felles typer for hele showet. Alle runder snakker med «deltakere» (Contestant):
// en spiller i «Alle mot alle», et lag i «Lagspill».

export type SceneId =
  | 'velkommen'
  | 'spillere'
  | 'modus'
  | 'lag'
  | 'runder'
  | 'intro'
  | 'runde'
  | 'vinner';

export type GameMode = 'alle' | 'lag';

export interface Player {
  id: string;
  name: string;
  emoji: string;
}

export interface Team {
  id: string;
  name: string;
  emoji: string;
  color: string;
  playerIds: string[];
}

export interface Contestant {
  id: string;
  name: string;
  emoji: string;
  color: string;
  /** Spillerne som hører til deltakeren (én i alle-mot-alle, flere i lag). */
  playerIds: string[];
}

export interface ScoreEvent {
  id: string;
  contestantId: string;
  delta: number;
  reason: string;
  roundId?: string;
  at: number;
}

export interface RoundInstance {
  id: string;
  type: string;
  enabled: boolean;
}

/** Fasen inne i en runde: intro-skjerm, selve spillet, poengtavle etterpå. */
export type RoundPhase = 'intro' | 'spill' | 'poeng';

export interface TimerState {
  durationMs: number;
  /** Tidspunkt (Date.now()) da tiden går ut, når timeren går. */
  endsAt: number | null;
  /** Gjenstående tid når timeren står stille. */
  remainingMs: number;
}

export type FxKind = 'leder' | 'comeback' | 'drama' | 'julemirakel' | 'au' | 'allin' | 'tid';

export interface FxEvent {
  id: string;
  kind: FxKind;
  title: string;
  subtitle?: string;
}

export type SoundName =
  | 'intro'
  | 'klikk'
  | 'riktig'
  | 'feil'
  | 'poeng'
  | 'tikk'
  | 'trommevirvel'
  | 'reveal'
  | 'finale'
  | 'seier'
  | 'whoosh'
  | 'drama';

export interface SoundCue {
  id: string;
  name: SoundName;
}

export interface GameState {
  version: 1;
  gameId: string | null;
  scene: SceneId;
  players: Player[];
  mode: GameMode;
  teams: Team[];
  hostPlays: boolean;
  roundPlan: RoundInstance[];
  roundIndex: number;
  roundPhase: RoundPhase;
  /** Hver rundetype eier sin egen tilstand her. */
  roundState: unknown;
  scoreLog: ScoreEvent[];
  effects: { doubleNext: string[] };
  /** Hvor ofte hver deltaker har vært i fokus, brukes til rettferdig fordeling. */
  attention: Record<string, number>;
  timer: TimerState;
  paused: boolean;
  fx: FxEvent | null;
  cue: SoundCue | null;
  /** Viser poengtavla oppå alt (programlederen kan slå den av og på). */
  showScoreboard: boolean;
  /** Antall plasseringer som er avslørt i vinnerscenen. */
  revealCount: number;
  settings: { sound: boolean };
}
