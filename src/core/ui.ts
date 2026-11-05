// Tilstand som bare gjelder dette vinduet (ikke lagres, ikke synkes).
import { create } from 'zustand';

interface UiState {
  /** Sist gang TV-vinduet sa ifra at det lever (ms). */
  tvLastSeen: number;
  /** Programlederen viser showet på denne skjermen (speilet HDMI uten eget TV-vindu). */
  singleScreen: boolean;
  hostBarHidden: boolean;
  setTvSeen(): void;
  setSingleScreen(v: boolean): void;
  toggleHostBar(): void;
}

export const useUi = create<UiState>((set) => ({
  tvLastSeen: 0,
  singleScreen: false,
  hostBarHidden: false,
  setTvSeen: () => set({ tvLastSeen: Date.now() }),
  setSingleScreen: (singleScreen) => set({ singleScreen, hostBarHidden: false }),
  toggleHostBar: () => set((s) => ({ hostBarHidden: !s.hostBarHidden })),
}));

export const TV_TIMEOUT_MS = 4500;
export const isTvConnected = (lastSeen: number, now = Date.now()) => now - lastSeen < TV_TIMEOUT_MS;
