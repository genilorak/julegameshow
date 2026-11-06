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

/** Gjør et valg i rundepanelet når hovedknappen venter på programlederen. */
function chooseInPanel(type: string | undefined, st: any, contestants: { id: string }[]) {
  const d = (a: unknown) => g().roundDispatch(a);
  if (type === 'pakker') {
    if (st.phase === 'velg') return d({ type: 'pick', index: st.gifts.findIndex((x: any) => !x.openedBy) });
    const kind = st.gifts[st.current].kind;
    if ((kind === 'stjel' || kind === 'bytt') && !st.target) return d({ type: 'target', contestantId: contestants.find((c) => c.id !== st.order[st.turn])!.id });
    return d({ type: 'resolve', success: true });
  }
  if (type === 'mime') return d({ type: 'guessed', guesserId: contestants.find((c) => c.id !== st.order[st.turn])!.id });
  throw new Error(`Runden ${type} venter på et valg testen ikke kjenner`);
}

function playWholeShow(count: number, mode: 'alle' | 'lag', everyRound = false) {
  g().resetAll();
  names.slice(0, count).forEach((n) => g().addPlayer(n));
  next(); // velkommen → spillere
  next(); // spillere → modus
  g().setMode(mode);
  next(); // → lag eller runder
  if (mode === 'lag') next(); // lag → runder
  expect(g().scene).toBe('runder');
  if (everyRound) g().roundPlan.filter((r) => !r.enabled).forEach((r) => g().toggleRound(r.id));
  const planned = g().roundPlan.filter((r) => r.enabled).map((r) => r.type);
  next(); // start showet → intro
  expect(g().scene).toBe('intro');
  for (let i = 0; i < introSteps(g()) - 1; i++) next();
  next(); // start første runde
  const contestants = contestantsOf(g());
  const played: string[] = [];
  let guard = 0;
  while (g().scene === 'runde' && guard++ < 3000) {
    const s = g();
    const type = s.roundPlan[s.roundIndex]?.type;
    if (s.roundPhase === 'intro') played.push(type!);
    const st = s.roundState as any;
    // Runder der hovedknappen kan trykkes i det uendelige: avslutt turen etter noen svar.
    if (s.roundPhase === 'spill' && type === 'lyn' && st.phase === 'spill' && (st.results[st.order[st.turn]]?.right ?? 0) >= 3) {
      g().roundDispatch({ type: 'stop' });
      continue;
    }
    if (s.roundPhase === 'spill' && type === 'duell' && st.phase === 'duell' && st.count >= 3) {
      g().roundDispatch({ type: 'out' });
      continue;
    }
    const p = primaryStep(s);
    if (p && !p.disabled) p.run();
    else chooseInPanel(type, s.roundState, contestants);
  }
  expect(played).toEqual(planned);
  expect(planned[planned.length - 1]).toBe('finale');
  expect(g().scene).toBe('vinner');
  for (let i = 0; i < contestants.length; i++) next();
  expect(g().revealCount).toBe(contestants.length);
  return { contestants, planned };
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
    const { contestants, planned } = playWholeShow(count, mode);
    expect(planned.length).toBeGreaterThanOrEqual(6);
    expect(planned.length).toBeLessThanOrEqual(7);
    expect(g().scoreLog.length).toBeGreaterThan(0);
    expect(contestants.length).toBe(mode === 'alle' ? count : { 5: 2, 6: 3, 8: 4, 10: 5 }[count as 5 | 6 | 8 | 10]);
  });

  it('klarer alle ti rundene pluss finalen på én kveld', () => {
    const { planned } = playWholeShow(6, 'lag', true);
    expect(planned).toHaveLength(11);
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
