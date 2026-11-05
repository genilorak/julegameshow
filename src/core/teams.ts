import { shuffle, uid } from './id';
import type { Contestant, GameMode, Player, Team } from './types';

export const MIN_PLAYERS = 4;
export const MAX_PLAYERS = 10;

export const PLAYER_EMOJIS = ['🎅', '🦌', '🎄', '⭐', '❄️', '🎁', '🍪', '🔔', '🕯️', '⛄', '🧦', '🍬'];

export const TEAM_PRESETS: Array<Pick<Team, 'name' | 'emoji' | 'color'>> = [
  { name: 'Team Rudolf', emoji: '🦌', color: '#d9534f' },
  { name: 'Team Pepperkake', emoji: '🍪', color: '#e0a64b' },
  { name: 'Team Gløgg', emoji: '🍷', color: '#b0477a' },
  { name: 'Team Nissefar', emoji: '🎅', color: '#4fa37a' },
  { name: 'Team Snøball', emoji: '❄️', color: '#6fa8dc' },
];

/** Lagstørrelser etter tabellen i oppdraget. Programlederen kan alltid endre. */
/** Egne farger per spiller i «Alle mot alle», så ti spillere ikke deler farge. */
export const PLAYER_COLORS = ['#d9534f', '#e0a64b', '#4fa37a', '#6fa8dc', '#b0477a', '#e07b4b', '#8f7fd6', '#3fb3a8', '#c9b458', '#d97aa6'];

export function suggestTeamSizes(playerCount: number): number[] {
  const table: Record<number, number[]> = {
    4: [2, 2],
    5: [2, 3],
    6: [2, 2, 2],
    7: [2, 2, 3],
    8: [2, 2, 2, 2],
    9: [3, 3, 3],
    10: [2, 2, 2, 2, 2],
  };
  if (table[playerCount]) return table[playerCount];
  if (playerCount < 4) return [playerCount];
  const teams = Math.ceil(playerCount / 2);
  return Array.from({ length: teams }, (_, i) => (i < playerCount % teams ? 3 : 2));
}

export const recommendedMode = (playerCount: number): GameMode => (playerCount <= 5 ? 'alle' : 'lag');

export function makeEmptyTeams(count: number): Team[] {
  return Array.from({ length: count }, (_, i) => ({
    id: uid('lag'),
    ...TEAM_PRESETS[i % TEAM_PRESETS.length],
    playerIds: [],
  }));
}

/** Trekker tilfeldige lag med foreslåtte størrelser. */
export function drawTeams(players: Player[], rand: () => number = Math.random, sizes = suggestTeamSizes(players.length)): Team[] {
  const order = shuffle(players.map((p) => p.id), rand);
  const teams = makeEmptyTeams(sizes.length);
  let cursor = 0;
  sizes.forEach((size, i) => {
    teams[i].playerIds = order.slice(cursor, cursor + size);
    cursor += size;
  });
  // Skulle det være spillere til overs (f.eks. etter manuelle endringer), fordeles de jevnt.
  order.slice(cursor).forEach((id, i) => teams[i % teams.length].playerIds.push(id));
  return teams;
}

/** Holder lagene i takt med spillerlista: fjerner borte spillere, plasserer nye på minste lag. */
export function reconcileTeams(teams: Team[], players: Player[]): Team[] {
  const ids = new Set(players.map((p) => p.id));
  const next = teams.map((t) => ({ ...t, playerIds: t.playerIds.filter((id) => ids.has(id)) }));
  const placed = new Set(next.flatMap((t) => t.playerIds));
  for (const p of players) {
    if (placed.has(p.id) || next.length === 0) continue;
    const smallest = next.reduce((a, b) => (b.playerIds.length < a.playerIds.length ? b : a));
    smallest.playerIds.push(p.id);
  }
  return next;
}

export function contestantsOf(state: { mode: GameMode; players: Player[]; teams: Team[] }): Contestant[] {
  if (state.mode === 'alle') {
    return state.players.map((p, i) => ({
      id: p.id,
      name: p.name,
      emoji: p.emoji,
      color: PLAYER_COLORS[i % PLAYER_COLORS.length],
      playerIds: [p.id],
    }));
  }
  return state.teams
    .filter((t) => t.playerIds.length > 0)
    .map((t) => ({ id: t.id, name: t.name, emoji: t.emoji, color: t.color, playerIds: t.playerIds }));
}
