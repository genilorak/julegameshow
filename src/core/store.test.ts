import { beforeEach, describe, expect, it } from 'vitest';
import { initialState, useGame } from './store';
import { primaryStep, backStep, introSteps } from './flow';
import { contestantsOf } from './teams';
import { totals } from './score';

const names = ['Mamma', 'Pappa', 'Emma', 'Jonas', 'Mormor', 'Morfar', 'Tante Kari', 'Onkel Per', 'Sofie', 'Lars'];
const g = () => useGame.getState();
const next = () => {
  const step = primaryStep(g());
  if (!step || step.disabled) throw new Error(`Kan ikke gå videre fra ${g().scene}: ${step?.hint}`);
  step.run();
};

function playWholeShow(count: number, mode: 'alle' | 'lag') {
  g().resetAll();
  names.slice(0, count).forEach((n) => g().addPlayer(n));
  next(); // velkommen → spillere
  next(); // spillere → modus
  g().setMode(mode);
  next(); // → lag eller runder
  if (mode === 'lag') next(); // lag → runder
  expect(g().scene).toBe('runder');
  next(); // start showet → intro
  expect(g().scene).toBe('intro');
  for (let i = 0; i < introSteps(g()) - 1; i++) next();
  next(); // start første runde
  expect(g().scene).toBe('runde');
  expect(g().roundPhase).toBe('intro');
  next(); // start runden
  expect(g().roundPhase).toBe('spill');
  const contestants = contestantsOf(g());
  let guard = 0;
  while (g().roundPhase === 'spill' && guard++ < 100) {
    // Første deltaker har alltid rett.
    const st = g().roundState as { phase: string; index: number; ids: string[] };
    if (st.phase === 'svar' && st.index < st.ids.length) g().award(contestants[0].id, 100, 'test');
    next();
  }
  expect(g().roundPhase).toBe('poeng');
  next(); // → vinner
  expect(g().scene).toBe('vinner');
  for (let i = 0; i < contestants.length; i++) next();
  expect(g().revealCount).toBe(contestants.length);
  return contestants;
}

describe('spillflyt', () => {
  beforeEach(() => useGame.setState({ ...initialState() }));

  it('krever minst fire spillere og maks ti', () => {
    names.slice(0, 3).forEach((n) => g().addPlayer(n));
    g().go('spillere');
    expect(primaryStep(g())?.disabled).toBe(true);
    names.slice(3).forEach((n) => g().addPlayer(n));
    g().addPlayer('Nummer elleve');
    expect(g().players).toHaveLength(10);
    expect(primaryStep(g())?.disabled).toBe(false);
  });

  it.each([
    [4, 'alle'],
    [5, 'lag'],
    [6, 'lag'],
    [8, 'lag'],
    [10, 'lag'],
  ] as const)('spiller et helt show med %i spillere (%s)', (count, mode) => {
    const contestants = playWholeShow(count, mode);
    const t = totals(g().scoreLog, contestants);
    expect(t[contestants[0].id]).toBe(800);
    expect(contestants.length).toBe(mode === 'alle' ? count : { 5: 2, 6: 3, 8: 4, 10: 5 }[count as 5 | 6 | 8 | 10]);
  });

  it('tilbake fungerer gjennom oppsettet', () => {
    names.slice(0, 4).forEach((n) => g().addPlayer(n));
    next();
    next();
    expect(g().scene).toBe('modus');
    backStep(g())?.run();
    expect(g().scene).toBe('spillere');
  });

  it('angre og negative poeng gir riktig sum', () => {
    names.slice(0, 4).forEach((n) => g().addPlayer(n));
    g().startShow();
    const [a] = contestantsOf(g());
    g().award(a.id, 100, 'x');
    g().award(a.id, -300, 'satset feil');
    expect(totals(g().scoreLog, contestantsOf(g()))[a.id]).toBe(-200);
    g().undoLastScore();
    expect(totals(g().scoreLog, contestantsOf(g()))[a.id]).toBe(100);
  });

  it('fjerning av spiller midt i spillet fjerner poengene deres fra tavla', () => {
    names.slice(0, 5).forEach((n) => g().addPlayer(n));
    g().startShow();
    const victim = g().players[2];
    g().award(victim.id, 300, 'x');
    g().removePlayer(victim.id);
    const t = totals(g().scoreLog, contestantsOf(g()));
    expect(Object.keys(t)).not.toContain(victim.id);
  });

  it('nytt spill beholder spillere og lag men nullstiller poeng', () => {
    playWholeShow(6, 'lag');
    const teams = g().teams;
    g().newGameSamePlayers();
    expect(g().players).toHaveLength(6);
    expect(g().teams).toEqual(teams);
    expect(g().scoreLog).toHaveLength(0);
    expect(g().scene).toBe('spillere');
  });
});
