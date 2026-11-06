// Spillets ene kilde til sannhet. Programledervinduet eier tilstanden og lagrer den
// i localStorage. TV-vinduet får en kopi via sync.ts og endrer aldri noe selv.
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { uid } from './id';
import { detectDrama, makeAward, totals } from './score';
import { MAX_PLAYERS, PLAYER_EMOJIS, contestantsOf, drawTeams, makeEmptyTeams, reconcileTeams, recommendedMode } from './teams';
import type { FxEvent, GameMode, GameState, RoundInstance, SceneId, SoundName, Team } from './types';
import { ROUND_ORDER, getRound } from '../rounds/registry';
import type { RoundContext } from '../rounds/types';

export const STORAGE_KEY = 'julegameshow:spill';
const FX_MS = 3400;

export const defaultRoundPlan = (): RoundInstance[] => suggestPlan(6, 'lag');

/**
 * Kveldsplanen tilpasset gruppa: 4 spillere får flere individuelle runder og dueller,
 * 6–8 får flest sosiale runder, 9–10 får mer lagbaserte runder. Finalen ligger alltid sist.
 */
export function suggestPlan(playerCount: number, mode: GameMode): RoundInstance[] {
  const picks =
    playerCount <= 5 && mode === 'alle'
      ? ['julequiz', 'duell', 'julefilm', 'pakker', 'lyn', 'satsing']
      : playerCount <= 8
        ? ['julequiz', 'hvem', 'julefilm', 'pakker', 'mime', 'satsing']
        : ['julequiz', 'hvem', 'julefilm', 'pakker', 'bilde', 'satsing'];
  const known = ROUND_ORDER.filter((t) => !getRound(t)?.fixedLast);
  const order = [...picks.filter((t) => known.includes(t)), ...known.filter((t) => !picks.includes(t))];
  const last = ROUND_ORDER.filter((t) => getRound(t)?.fixedLast);
  return [...order, ...last].map((type) => ({ id: uid('runde'), type, enabled: picks.includes(type) || last.includes(type) }));
}

export function initialState(): GameState {
  return {
    version: 1,
    gameId: null,
    scene: 'velkommen',
    players: [],
    mode: 'alle',
    teams: [],
    hostPlays: false,
    roundPlan: defaultRoundPlan(),
    roundIndex: -1,
    roundPhase: 'intro',
    roundState: null,
    scoreLog: [],
    effects: { doubleNext: [] },
    attention: {},
    timer: { durationMs: 0, endsAt: null, remainingMs: 0 },
    paused: false,
    fx: null,
    cue: null,
    showScoreboard: false,
    revealCount: 0,
    settings: { sound: true },
    planTouched: false,
  };
}

/** Feltene som utgjør selve spillet (det som synkes og lagres). */
export const GAME_KEYS = Object.keys(initialState()) as Array<keyof GameState>;

export function pickGame(s: GameState): GameState {
  const out = {} as Record<string, unknown>;
  for (const k of GAME_KEYS) out[k] = s[k];
  return out as unknown as GameState;
}

export function roundContext(s: GameState): RoundContext {
  const inst = s.roundPlan[s.roundIndex];
  return {
    roundId: inst?.id ?? '',
    contestants: contestantsOf(s),
    players: s.players,
    mode: s.mode,
    hostPlays: s.hostPlays,
    attention: s.attention,
    scores: totals(s.scoreLog, contestantsOf(s)),
  };
}

export const nextEnabledIndex = (plan: RoundInstance[], from: number) => {
  for (let i = from + 1; i < plan.length; i++) if (plan[i].enabled && getRound(plan[i].type)) return i;
  return -1;
};

export const prevEnabledIndex = (plan: RoundInstance[], from: number) => {
  for (let i = from - 1; i >= 0; i--) if (plan[i].enabled && getRound(plan[i].type)) return i;
  return -1;
};

export interface GameActions {
  go(scene: SceneId): void;
  addPlayer(name: string): void;
  renamePlayer(id: string, name: string): void;
  setPlayerEmoji(id: string, emoji: string): void;
  removePlayer(id: string): void;
  movePlayer(id: string, dir: -1 | 1): void;
  setHostPlays(v: boolean): void;
  setMode(mode: GameMode): void;
  drawTeams(): void;
  setTeamCount(n: number): void;
  movePlayerToTeam(playerId: string, teamId: string): void;
  renameTeam(id: string, name: string): void;
  toggleRound(id: string): void;
  moveRound(id: string, dir: -1 | 1): void;
  startShow(): void;
  beginRound(index: number): void;
  playRound(): void;
  roundDispatch(action: unknown): void;
  endRound(): void;
  nextRound(): void;
  previousRound(): void;
  award(contestantId: string, delta: number, reason: string, opts?: { manual?: boolean }): string;
  revoke(eventId: string): void;
  undoLastScore(): void;
  grantDoubleNext(contestantId: string): void;
  startTimer(ms?: number): void;
  pauseTimer(): void;
  resetTimer(ms?: number): void;
  togglePause(): void;
  showFx(event: Omit<FxEvent, 'id'>): void;
  clearFx(): void;
  playSound(name: SoundName): void;
  playMelody(id: string): void;
  /** Foreslår kveldsplan etter antall spillere, hvis programlederen ikke har endret den. */
  suggestPlanIfUntouched(): void;
  toggleScoreboard(): void;
  revealNext(): void;
  toggleSound(): void;
  newGameSamePlayers(): void;
  resetAll(): void;
  /** Små direkte endringer fra dreieboka (flow.ts), f.eks. steg i introen. */
  patch(p: Partial<GameState>): void;
  /** Brukes av TV-vinduet når det får ny tilstand. */
  replace(state: GameState): void;
}

export type Store = GameState & GameActions;

let fxTimer: ReturnType<typeof setTimeout> | undefined;

export const isTvWindow = () =>
  typeof location !== 'undefined' && new URLSearchParams(location.search).get('vindu') === 'tv';

const storage = createJSONStorage<GameState>(() =>
  typeof localStorage !== 'undefined' && !isTvWindow()
    ? localStorage
    : { getItem: () => null, setItem: () => {}, removeItem: () => {} },
);

export const useGame = create<Store>()(
  persist(
    (set, get) => {
      const cue = (name: SoundName) => set({ cue: { id: uid('lyd'), name } });

      const showFx = (event: Omit<FxEvent, 'id'>) => {
        set({ fx: { ...event, id: uid('fx') } });
        clearTimeout(fxTimer);
        fxTimer = setTimeout(() => set({ fx: null }), FX_MS);
      };

      const updatePlayers = (fn: (s: GameState) => GameState['players']) =>
        set((s) => {
          const players = fn(s);
          return { players, teams: s.mode === 'lag' ? reconcileTeams(s.teams, players) : s.teams };
        });

      return {
        ...initialState(),

        go: (scene) => {
          set({ scene });
          cue('whoosh');
        },

        addPlayer: (name) =>
          updatePlayers((s) => {
            const clean = name.trim();
            if (!clean || s.players.length >= MAX_PLAYERS) return s.players;
            const used = new Set(s.players.map((p) => p.emoji));
            const emoji = PLAYER_EMOJIS.find((e) => !used.has(e)) ?? PLAYER_EMOJIS[s.players.length % PLAYER_EMOJIS.length];
            return [...s.players, { id: uid('spiller'), name: clean, emoji }];
          }),

        renamePlayer: (id, name) =>
          updatePlayers((s) => s.players.map((p) => (p.id === id ? { ...p, name: name.slice(0, 24) } : p))),

        setPlayerEmoji: (id, emoji) => updatePlayers((s) => s.players.map((p) => (p.id === id ? { ...p, emoji } : p))),

        removePlayer: (id) => updatePlayers((s) => s.players.filter((p) => p.id !== id)),

        movePlayer: (id, dir) =>
          updatePlayers((s) => {
            const i = s.players.findIndex((p) => p.id === id);
            const j = i + dir;
            if (i < 0 || j < 0 || j >= s.players.length) return s.players;
            const next = [...s.players];
            [next[i], next[j]] = [next[j], next[i]];
            return next;
          }),

        setHostPlays: (hostPlays) => set({ hostPlays }),

        setMode: (mode) =>
          set((s) => ({
            mode,
            teams: mode !== 'lag' ? s.teams : s.teams.length === 0 ? drawTeams(s.players) : reconcileTeams(s.teams, s.players),
          })),

        drawTeams: () => {
          set((s) => ({ teams: drawTeams(s.players) }));
          cue('trommevirvel');
        },

        setTeamCount: (n) =>
          set((s) => {
            const count = Math.max(2, Math.min(5, n));
            const teams: Team[] = makeEmptyTeams(count);
            s.players.forEach((p, i) => teams[i % count].playerIds.push(p.id));
            return { teams };
          }),

        movePlayerToTeam: (playerId, teamId) =>
          set((s) => ({
            teams: s.teams.map((t) => ({
              ...t,
              playerIds:
                t.id === teamId
                  ? [...t.playerIds.filter((id) => id !== playerId), playerId]
                  : t.playerIds.filter((id) => id !== playerId),
            })),
          })),

        renameTeam: (id, name) => set((s) => ({ teams: s.teams.map((t) => (t.id === id ? { ...t, name: name.slice(0, 24) } : t)) })),

        toggleRound: (id) => set((s) => ({ planTouched: true, roundPlan: s.roundPlan.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)) })),

        suggestPlanIfUntouched: () => set((s) => (s.planTouched ? {} : { roundPlan: suggestPlan(s.players.length, s.mode) })),

        moveRound: (id, dir) =>
          set((s) => {
            const i = s.roundPlan.findIndex((r) => r.id === id);
            const j = i + dir;
            if (i < 0 || j < 0 || j >= s.roundPlan.length) return {};
            if (getRound(s.roundPlan[i].type)?.fixedLast || getRound(s.roundPlan[j].type)?.fixedLast) return {};
            const plan = [...s.roundPlan];
            [plan[i], plan[j]] = [plan[j], plan[i]];
            return { roundPlan: plan, planTouched: true };
          }),

        startShow: () => {
          set({
            gameId: uid('spill'),
            scene: 'intro',
            scoreLog: [],
            effects: { doubleNext: [] },
            attention: {},
            roundIndex: -1,
            roundState: null,
            revealCount: 0,
            fx: null,
          });
          cue('intro');
        },

        beginRound: (index) => {
          set({ scene: 'runde', roundIndex: index, roundPhase: 'intro', roundState: null, showScoreboard: false, timer: { durationMs: 0, endsAt: null, remainingMs: 0 } });
          cue('reveal');
        },

        playRound: () => {
          const s = get();
          const def = getRound(s.roundPlan[s.roundIndex]?.type);
          if (!def) return;
          set({ roundPhase: 'spill', roundState: def.init(roundContext(s)) });
          cue('whoosh');
        },

        roundDispatch: (action) => {
          const s = get();
          const def = getRound(s.roundPlan[s.roundIndex]?.type);
          if (!def || s.roundPhase !== 'spill' || s.roundState == null) return;
          const ctx = roundContext(s);
          const prev = s.roundState;
          const next = def.reduce(prev, action, ctx);
          set({ roundState: next });
          const sound = def.soundFor?.(action, prev);
          if (sound) cue(sound);
          for (const e of def.effectsFor?.(action, prev, next, ctx) ?? []) {
            const g = get();
            if (e.kind === 'award') g.award(e.contestantId, e.delta, e.reason, { manual: e.manual });
            else if (e.kind === 'double') g.grantDoubleNext(e.contestantId);
            else if (e.kind === 'attention')
              set((st) => ({ attention: { ...st.attention, ...Object.fromEntries(e.contestantIds.map((id) => [id, (st.attention[id] ?? 0) + 1])) } }));
            else if (e.kind === 'fx') showFx(e.fx);
            else if (e.kind === 'sound') cue(e.name);
            else if (e.kind === 'melody') g.playMelody(e.id);
            else if (e.kind === 'timer') (e.ms === null ? g.resetTimer(0) : g.startTimer(e.ms));
          }
        },

        endRound: () => {
          set({ roundPhase: 'poeng', timer: { durationMs: 0, endsAt: null, remainingMs: 0 } });
          cue('poeng');
        },

        nextRound: () => {
          const s = get();
          const next = nextEnabledIndex(s.roundPlan, s.roundIndex);
          if (next === -1) {
            set({ scene: 'vinner', revealCount: 0, showScoreboard: false });
            cue('finale');
          } else get().beginRound(next);
        },

        previousRound: () => {
          const s = get();
          const prev = prevEnabledIndex(s.roundPlan, s.roundIndex);
          if (prev !== -1) get().beginRound(prev);
        },

        award: (contestantId, delta, reason, opts = {}) => {
          const s = get();
          const contestants = contestantsOf(s);
          const before = totals(s.scoreLog, contestants);
          const res = makeAward(contestantId, delta, reason, s.effects.doubleNext, {
            manual: opts.manual,
            roundId: s.roundPlan[s.roundIndex]?.id,
          });
          const scoreLog = [...s.scoreLog, res.event];
          set({ scoreLog, effects: { ...s.effects, doubleNext: res.doubleNext } });
          cue(res.event.delta >= 0 ? 'poeng' : 'feil');
          const drama = detectDrama(before, totals(scoreLog, contestants), contestants, { contestantId, delta: res.event.delta });
          if (res.doubled) showFx({ kind: 'julemirakel', title: 'DOBBEL GEVINST! ⭐', subtitle: `${res.event.delta} poeng` });
          else if (drama) {
            showFx(drama);
            cue('drama');
          }
          return res.event.id;
        },

        revoke: (eventId) => set((s) => ({ scoreLog: s.scoreLog.filter((e) => e.id !== eventId) })),

        undoLastScore: () => set((s) => ({ scoreLog: s.scoreLog.slice(0, -1) })),

        grantDoubleNext: (contestantId) =>
          set((s) => ({ effects: { ...s.effects, doubleNext: [...new Set([...s.effects.doubleNext, contestantId])] } })),

        startTimer: (ms) =>
          set((s) => {
            const remaining = ms ?? (s.timer.endsAt ? s.timer.endsAt - Date.now() : s.timer.remainingMs || s.timer.durationMs);
            return { timer: { durationMs: ms ?? s.timer.durationMs, endsAt: Date.now() + remaining, remainingMs: remaining } };
          }),

        pauseTimer: () =>
          set((s) =>
            s.timer.endsAt ? { timer: { ...s.timer, endsAt: null, remainingMs: Math.max(0, s.timer.endsAt - Date.now()) } } : {},
          ),

        resetTimer: (ms) =>
          set((s) => {
            const d = ms ?? s.timer.durationMs;
            return { timer: { durationMs: d, endsAt: null, remainingMs: d } };
          }),

        togglePause: () => {
          const s = get();
          if (!s.paused) get().pauseTimer();
          set({ paused: !s.paused });
        },

        showFx,
        clearFx: () => set({ fx: null }),
        playSound: cue,
        playMelody: (melody) => set({ cue: { id: uid('lyd'), name: 'klikk', melody } }),

        toggleScoreboard: () => set((s) => ({ showScoreboard: !s.showScoreboard })),

        revealNext: () => {
          const s = get();
          const total = contestantsOf(s).length;
          if (s.revealCount >= total) return;
          const revealCount = s.revealCount + 1;
          set({ revealCount });
          cue(revealCount === total ? 'seier' : 'trommevirvel');
        },

        toggleSound: () => set((s) => ({ settings: { ...s.settings, sound: !s.settings.sound } })),

        newGameSamePlayers: () =>
          set((s) => ({
            ...initialState(),
            players: s.players,
            mode: s.mode,
            teams: s.teams,
            hostPlays: s.hostPlays,
            roundPlan: s.roundPlan,
            settings: s.settings,
            scene: 'spillere',
          })),

        resetAll: () => set({ ...initialState() }),

        patch: (p) => set(p),
        replace: (state) => set(pickGame(state)),
      };
    },
    {
      name: STORAGE_KEY,
      storage,
      version: 1,
      partialize: (s) => ({ ...pickGame(s), fx: null, cue: null }),
      // Runder som ikke finnes lenger, eller nye runder i en ny versjon, tas inn uten at et lagret spill brekker.
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<GameState>;
        const merged = { ...current, ...saved };
        const known = (saved.roundPlan ?? []).filter((r) => getRound(r.type));
        const missing = defaultRoundPlan().filter((r) => !known.some((k) => k.type === r.type));
        const plan = [...known, ...missing.map((r) => ({ ...r, enabled: !!getRound(r.type)?.fixedLast }))];
        // Finalen ligger alltid sist.
        merged.roundPlan = [...plan.filter((r) => !getRound(r.type)?.fixedLast), ...plan.filter((r) => getRound(r.type)?.fixedLast)];
        merged.planTouched = saved.planTouched ?? false;
        if (merged.scene === 'runde' && !merged.roundPlan[merged.roundIndex]) merged.scene = 'velkommen';
        return merged;
      },
    },
  ),
);

export const hasGameInProgress = (s: GameState) => s.gameId !== null && s.scene !== 'velkommen';

export { recommendedMode };
