import { useEffect, useState } from 'react';
import { STORAGE_KEY, useGame } from '../core/store';
import { startTvSync } from '../core/sync';
import { ShowStage } from '../scenes/ShowStage';
import { SoundManager } from '../sound/SoundManager';
import { toggleFullscreen } from '../host/HostApp';

/**
 * TV-vinduet: viser bare showet. Kan vises på TV via HDMI (dra vinduet over og trykk F)
 * eller via Chromecast («Cast fane» i Chrome, som også sender lyden).
 */
export function TvApp() {
  const [started, setStarted] = useState(false);

  useEffect(() => {
    // Første bilde fra lagret spill, så TV-en ikke blinker før programlederen svarer.
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) useGame.getState().replace({ ...useGame.getState(), ...JSON.parse(raw).state, fx: null, cue: null });
    } catch {
      // Ødelagt lagring: vi venter på programlederen i stedet.
    }
    return startTvSync();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key.toLowerCase() === 'f' && toggleFullscreen();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div style={{ height: '100%' }} onDoubleClick={toggleFullscreen}>
      <ShowStage interactive={false} audio={started} />
      {!started && (
        <div
          className="tv-gate"
          role="button"
          tabIndex={0}
          onClick={() => {
            SoundManager.unlock();
            toggleFullscreen();
            setStarted(true);
          }}
        >
          <div>
            <h1>📺 TV-skjermen er klar</h1>
            <p>Klikk her for fullskjerm og lyd.</p>
            <p style={{ opacity: 0.6, marginTop: 24 }}>HDMI: dra vinduet over på TV-en først. Chromecast: velg «Cast fane» i Chrome.</p>
          </div>
        </div>
      )}
    </div>
  );
}
