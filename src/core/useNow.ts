import { useEffect, useState } from 'react';
import type { TimerState } from './types';

/** Gjenstående millisekunder på timeren, oppdatert ti ganger i sekundet. */
export function useTimeLeft(timer: TimerState): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!timer.endsAt) return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [timer.endsAt]);
  return timer.endsAt ? Math.max(0, timer.endsAt - now) : timer.remainingMs;
}
