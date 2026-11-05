import { describe, expect, it } from 'vitest';
import { contestantsOf, drawTeams, reconcileTeams, recommendedMode, suggestTeamSizes } from './teams';
import type { Player } from './types';

const players = (n: number): Player[] => Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: `Spiller ${i}`, emoji: '⭐' }));

describe('lag', () => {
  it.each([
    [4, [2, 2]],
    [5, [2, 3]],
    [6, [2, 2, 2]],
    [7, [2, 2, 3]],
    [8, [2, 2, 2, 2]],
    [9, [3, 3, 3]],
    [10, [2, 2, 2, 2, 2]],
  ])('%i spillere gir lagene %j', (n, sizes) => {
    expect(suggestTeamSizes(n)).toEqual(sizes);
    const teams = drawTeams(players(n));
    expect(teams.map((t) => t.playerIds.length)).toEqual(sizes);
    expect(new Set(teams.flatMap((t) => t.playerIds)).size).toBe(n);
  });

  it('anbefaler alle mot alle for små grupper', () => {
    expect(recommendedMode(4)).toBe('alle');
    expect(recommendedMode(5)).toBe('alle');
    expect(recommendedMode(6)).toBe('lag');
  });

  it('fjerner spillere som er slettet og plasserer nye på minste lag', () => {
    const teams = drawTeams(players(6));
    const remaining = players(6).filter((p) => p.id !== 'p0');
    const next = reconcileTeams(teams, [...remaining, { id: 'ny', name: 'Ny', emoji: '🎅' }]);
    const all = next.flatMap((t) => t.playerIds);
    expect(all).not.toContain('p0');
    expect(all).toContain('ny');
    expect(all).toHaveLength(6);
  });

  it('hopper over tomme lag som deltakere', () => {
    const teams = drawTeams(players(4));
    teams[1].playerIds = [];
    expect(contestantsOf({ mode: 'lag', players: players(4), teams })).toHaveLength(1);
    expect(contestantsOf({ mode: 'alle', players: players(4), teams })).toHaveLength(4);
  });
});
