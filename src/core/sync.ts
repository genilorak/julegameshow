// Programledervinduet og TV-vinduet snakker sammen via BroadcastChannel.
// Det virker uten server så lenge begge vinduene er i samme nettleser på samme maskin.
import { pickGame, useGame } from './store';
import { useUi } from './ui';
import type { GameState } from './types';

const CHANNEL = 'julegameshow';

type Msg = { type: 'state'; state: GameState } | { type: 'hello' } | { type: 'ping' };

/** Kjøres i programledervinduet: sender all ny tilstand til TV-en. */
export function startHostSync(): () => void {
  if (typeof BroadcastChannel === 'undefined') return () => {};
  const ch = new BroadcastChannel(CHANNEL);
  const send = () => ch.postMessage({ type: 'state', state: pickGame(useGame.getState()) } satisfies Msg);
  const unsub = useGame.subscribe(send);
  ch.onmessage = (e: MessageEvent<Msg>) => {
    if (e.data.type === 'hello') send();
    if (e.data.type === 'hello' || e.data.type === 'ping') useUi.getState().setTvSeen();
  };
  return () => {
    unsub();
    ch.close();
  };
}

/** Kjøres i TV-vinduet: tar imot tilstand og sier ifra at det lever. */
export function startTvSync(): () => void {
  if (typeof BroadcastChannel === 'undefined') return () => {};
  const ch = new BroadcastChannel(CHANNEL);
  ch.onmessage = (e: MessageEvent<Msg>) => {
    if (e.data.type === 'state') useGame.getState().replace(e.data.state);
  };
  ch.postMessage({ type: 'hello' } satisfies Msg);
  const id = setInterval(() => ch.postMessage({ type: 'ping' } satisfies Msg), 1500);
  return () => {
    clearInterval(id);
    ch.close();
  };
}
