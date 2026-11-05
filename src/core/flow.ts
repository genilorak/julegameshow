// Showets dreiebok: hva hovedknappen («Neste») og «Tilbake» gjør i hver scene.
// Brukes av programlederpanelet, kontrollstripa og hurtigtastene, så alt oppfører seg likt.
import { MIN_PLAYERS, contestantsOf, recommendedMode } from './teams';
import { nextEnabledIndex, prevEnabledIndex, roundContext, type Store } from './store';
import { getRound } from '../rounds/registry';

export interface FlowStep {
  label: string;
  run: () => void;
  disabled?: boolean;
  hint?: string;
}

export function introSteps(s: Store) {
  // Introen bruker revealCount som steg-teller. 0: tittel, 1..n: deltakerne presenteres, n+1: «La showet begynne»
  return contestantsOf(s).length + 2;
}

export function primaryStep(s: Store): FlowStep | null {
  const contestants = contestantsOf(s);
  switch (s.scene) {
    case 'velkommen':
      return { label: 'Start showet', run: () => s.go('spillere') };
    case 'spillere': {
      const missing = MIN_PLAYERS - s.players.length;
      return {
        label: 'Videre',
        run: () => {
          // Foreslå modus etter antall spillere hver gang gruppa endres. Programlederen kan bytte.
          if (s.teams.length === 0 || s.teams.reduce((n, t) => n + t.playerIds.length, 0) !== s.players.length) s.setMode(recommendedMode(s.players.length));
          s.go('modus');
        },
        disabled: missing > 0,
        hint: missing > 0 ? `Legg til ${missing} til for å starte` : undefined,
      };
    }
    case 'modus':
      return {
        label: 'Videre',
        run: () => {
          if (s.mode === 'lag') {
            if (s.teams.length === 0) s.drawTeams();
            s.go('lag');
          } else s.go('runder');
        },
      };
    case 'lag': {
      const empty = s.teams.some((t) => t.playerIds.length === 0);
      return { label: 'Videre', run: () => s.go('runder'), disabled: empty, hint: empty ? 'Alle lag må ha minst én spiller' : undefined };
    }
    case 'runder': {
      const none = nextEnabledIndex(s.roundPlan, -1) === -1;
      return { label: 'Start showet!', run: () => s.startShow(), disabled: none, hint: none ? 'Velg minst én runde' : undefined };
    }
    case 'intro': {
      const last = introSteps(s) - 1;
      if (s.revealCount < last) {
        return {
          label: s.revealCount === 0 ? 'Presenter deltakerne' : 'Neste deltaker',
          run: () => {
            s.patch({ revealCount: s.revealCount + 1 });
            s.playSound(s.revealCount === 0 ? 'reveal' : 'poeng');
          },
        };
      }
      return { label: 'Start første runde', run: () => s.beginRound(nextEnabledIndex(s.roundPlan, -1)) };
    }
    case 'runde': {
      const def = getRound(s.roundPlan[s.roundIndex]?.type);
      if (!def) return { label: 'Neste runde', run: () => s.nextRound() };
      if (s.roundPhase === 'intro') return { label: 'Start runden', run: () => s.playRound() };
      if (s.roundPhase === 'spill') {
        const p = s.roundState != null ? def.primary(s.roundState) : null;
        if (p) return { label: p.label, run: () => s.roundDispatch(p.action) };
        return { label: 'Vis poengtavla', run: () => s.endRound() };
      }
      const isLast = nextEnabledIndex(s.roundPlan, s.roundIndex) === -1;
      return { label: isLast ? 'Kår vinneren' : 'Neste runde', run: () => s.nextRound() };
    }
    case 'vinner': {
      if (s.revealCount < contestants.length) {
        const place = contestants.length - s.revealCount;
        return { label: place === 1 ? 'Avslør vinneren! 🏆' : `Avslør ${place}. plass`, run: () => s.revealNext() };
      }
      return { label: 'Nytt spill', run: () => s.newGameSamePlayers() };
    }
  }
}

export function backStep(s: Store): FlowStep | null {
  switch (s.scene) {
    case 'velkommen':
      return null;
    case 'spillere':
      return { label: 'Tilbake', run: () => s.go('velkommen') };
    case 'modus':
      return { label: 'Tilbake', run: () => s.go('spillere') };
    case 'lag':
      return { label: 'Tilbake', run: () => s.go('modus') };
    case 'runder':
      return { label: 'Tilbake', run: () => s.go(s.mode === 'lag' ? 'lag' : 'modus') };
    case 'intro':
      if (s.revealCount > 0) return { label: 'Tilbake', run: () => s.patch({ revealCount: s.revealCount - 1 }) };
      return { label: 'Tilbake', run: () => s.go('runder') };
    case 'runde': {
      const def = getRound(s.roundPlan[s.roundIndex]?.type);
      if (s.roundPhase === 'spill' && def?.back && s.roundState != null) {
        const a = def.back(s.roundState);
        if (a) return { label: 'Tilbake', run: () => s.roundDispatch(a) };
      }
      if (s.roundPhase === 'poeng') return { label: 'Tilbake til runden', run: () => s.patch({ roundPhase: s.roundState ? 'spill' : 'intro' }) };
      if (s.roundPhase === 'spill') return { label: 'Til rundeintro', run: () => s.patch({ roundPhase: 'intro' }) };
      const prev = prevEnabledIndex(s.roundPlan, s.roundIndex);
      if (prev === -1) return { label: 'Tilbake', run: () => s.patch({ scene: 'intro', revealCount: introSteps(s) - 1 }) };
      return { label: 'Forrige runde', run: () => s.patch({ roundIndex: prev, roundPhase: 'poeng', roundState: null }) };
    }
    case 'vinner':
      if (s.revealCount > 0) return { label: 'Tilbake', run: () => s.patch({ revealCount: s.revealCount - 1 }) };
      return null;
  }
}

export { roundContext };
