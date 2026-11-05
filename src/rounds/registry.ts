// Alle runder showet kjenner til. En ny runde legges til her med én linje.
import { quizRound } from './quiz';
import type { RoundDefinition } from './types';

const ROUNDS: RoundDefinition[] = [quizRound];

export const ROUND_ORDER = ROUNDS.map((r) => r.type);

export const getRound = (type: string | undefined): RoundDefinition | undefined => ROUNDS.find((r) => r.type === type);

export const allRounds = () => ROUNDS;
