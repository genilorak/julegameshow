// Alle runder showet kjenner til. En ny runde legges til her med én linje.
import { bildeRound } from './bilde';
import { duellRound } from './duell';
import { finaleRound } from './finale';
import { hvemRound } from './hvem';
import { julefilmRound } from './julefilm';
import { lydRound } from './lyd';
import { lynRound } from './lyn';
import { mimeRound } from './mime';
import { pakkerRound } from './pakker';
import { quizRound } from './quiz';
import { satsingRound } from './satsing';
import type { RoundDefinition } from './types';

const ROUNDS: RoundDefinition[] = [quizRound, julefilmRound, hvemRound, satsingRound, lynRound, pakkerRound, duellRound, bildeRound, lydRound, mimeRound, finaleRound];

export const ROUND_ORDER = ROUNDS.map((r) => r.type);

export const getRound = (type: string | undefined): RoundDefinition | undefined => ROUNDS.find((r) => r.type === type);

export const allRounds = () => ROUNDS;
