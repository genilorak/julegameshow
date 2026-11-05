import type { ComponentType } from 'react';
import type { Contestant, FxEvent, GameMode, Player, SoundName } from '../core/types';

/** Det en runde får vite om spillet rundt seg. */
export interface RoundContext {
  roundId: string;
  contestants: Contestant[];
  players: Player[];
  mode: GameMode;
  hostPlays: boolean;
  attention: Record<string, number>;
}

/** Det programlederkontrollene kan gjøre utover sin egen tilstand. */
export interface RoundApi<A> {
  dispatch(action: A): void;
  /** Gir poeng og returnerer id-en til poenghendelsen (så den kan angres). */
  award(contestantId: string, delta: number, reason: string): string;
  /** Fjerner en poenghendelse igjen. */
  revoke(eventId: string): void;
  sound(name: SoundName): void;
  fx(event: Omit<FxEvent, 'id'>): void;
  startTimer(ms: number): void;
  stopTimer(): void;
  /** Avslutter runden og går til poengtavla. */
  endRound(): void;
}

export interface StageProps<S> {
  state: S;
  ctx: RoundContext;
}

export interface ControlsProps<S, A> {
  state: S;
  ctx: RoundContext;
  api: RoundApi<A>;
  /** Fasit vises bare på laptopen, og ikke når programlederen spiller med. */
  showAnswers: boolean;
}

export interface PrimaryAction<A> {
  label: string;
  action: A;
}

/**
 * Kontrakten alle runder følger. En ny runde = en ny mappe som eksporterer
 * en RoundDefinition, pluss én linje i registry.ts.
 */
export interface RoundDefinition<S = any, A = any> {
  type: string;
  title: string;
  emoji: string;
  /** Kort undertittel på rundeintroen. */
  tagline: string;
  /** Reglene i to-tre korte setninger, vist stort på TV-en. */
  rules: string[];
  /** Ca. minutter runden tar, brukes i kveldsplanen. */
  minutes: number;
  init(ctx: RoundContext, rand?: () => number): S;
  reduce(state: S, action: A, ctx: RoundContext): S;
  isDone(state: S): boolean;
  /** Hovedknappen (og mellomromstasten) for programlederen. */
  primary(state: S): PrimaryAction<A> | null;
  /** Hva «Tilbake» gjør, eller null hvis det ikke går an. */
  back?(state: S): A | null;
  /** Lyd som skal spilles når en handling skjer (valgfritt). */
  soundFor?(action: A, state: S): SoundName | null;
  Stage: ComponentType<StageProps<S>>;
  Controls: ComponentType<ControlsProps<S, A>>;
}
