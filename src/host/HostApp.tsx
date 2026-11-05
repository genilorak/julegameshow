import { useEffect, useState } from 'react';
import { backStep, primaryStep } from '../core/flow';
import { hasGameInProgress, useGame } from '../core/store';
import { startHostSync } from '../core/sync';
import { isTvConnected, useUi } from '../core/ui';
import { ShowStage } from '../scenes/ShowStage';
import { SoundManager } from '../sound/SoundManager';
import { FlowCard, RoundControls, ScoreCard, SceneEditor, TimerCard } from './HostPanels';

/** Programleders vindu: enten panel + forhåndsvisning, eller showet på hele skjermen med kontrollstripe. */
export function HostApp() {
  const singleScreen = useUi((s) => s.singleScreen);
  const tvConnected = useTvConnected();
  const [resume, setResume] = useState(() => hasGameInProgress(useGame.getState()));

  useEffect(() => startHostSync(), []);
  useTimerWatcher();
  useShortcuts();

  // Lyd kan bare starte etter et klikk eller tastetrykk i vinduet.
  useEffect(() => {
    const unlock = () => SoundManager.unlock();
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  return (
    <>
      {singleScreen ? <SingleScreen audio={!tvConnected} /> : <HostLayout tvConnected={tvConnected} />}
      {resume && <ResumeModal onClose={() => setResume(false)} />}
    </>
  );
}

function HostLayout({ tvConnected }: { tvConnected: boolean }) {
  return (
    <div className="host">
      <TopBar tvConnected={tvConnected} />
      <div className="host-main">
        <div className="host-preview">
          <div className="frame">
            <ShowStage interactive={false} audio={!tvConnected} />
          </div>
          <span className="caption">
            {tvConnected
              ? 'Forhåndsvisning. Dette er det familien ser på TV-en akkurat nå.'
              : 'Forhåndsvisning. Åpne TV-vinduet og vis det på TV-en, eller velg «Én skjerm».'}
          </span>
          <div className="shortcuts">
            <kbd>Mellomrom</kbd> neste · <kbd>←</kbd> tilbake · <kbd>S</kbd> poengtavle · <kbd>T</kbd> timer · <kbd>P</kbd> pause · <kbd>M</kbd> lyd av/på
          </div>
        </div>
        <aside className="host-side">
          <FlowCard />
          <SceneEditor />
          <TimerCard />
          <ScoreCard />
        </aside>
      </div>
    </div>
  );
}

function TopBar({ tvConnected }: { tvConnected: boolean }) {
  const s = useGame();
  const setSingle = useUi((u) => u.setSingleScreen);
  const [menu, setMenu] = useState(false);
  const [confirm, setConfirm] = useState<null | 'nytt' | 'alt'>(null);

  return (
    <header className="host-top">
      <span className="host-brand">🎄 Programleder</span>
      <span className={`tv-status ${tvConnected ? 'on' : ''}`}>
        <span className="dot" /> {tvConnected ? 'TV-vindu tilkoblet' : 'Ingen TV-vindu'}
      </span>
      <button className="hp-btn gold" onClick={openTvWindow}>
        📺 Åpne TV-vindu
      </button>
      <button className="hp-btn" onClick={() => setSingle(true)} title="Vis showet på denne skjermen (speilet HDMI)">
        🖥 Én skjerm
      </button>
      <button className="hp-btn" onClick={() => s.toggleSound()} title="M">
        {s.settings.sound ? '🔊 Lyd på' : '🔇 Lyd av'}
      </button>
      <button className={`hp-btn ${s.paused ? 'active' : ''}`} onClick={() => s.togglePause()} title="P">
        {s.paused ? '▶ Fortsett' : '⏸ Pause'}
      </button>
      <button className="hp-btn" onClick={() => setMenu(!menu)} aria-expanded={menu}>
        ☰ Meny
      </button>
      {menu && (
        <div className="menu-pop" onMouseLeave={() => setMenu(false)}>
          <button className="hp-btn" onClick={() => setConfirm('nytt')}>
            🔄 Nytt spill med samme spillere
          </button>
          <button className="hp-btn red" onClick={() => setConfirm('alt')}>
            🗑 Start helt på nytt
          </button>
          <p className="hp-note" style={{ padding: '4px 6px' }}>
            «Rediger gameshow» (egne spørsmål, bilder og lyd) kommer i en senere versjon.
          </p>
        </div>
      )}
      {confirm && (
        <div className="modal-back" onClick={() => setConfirm(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{confirm === 'nytt' ? 'Nytt spill?' : 'Start helt på nytt?'}</h2>
            <p>{confirm === 'nytt' ? 'Poengene nullstilles. Spillere og lag beholdes.' : 'Alle spillere, lag og poeng slettes.'}</p>
            <div className="hp-row">
              <button className="hp-btn" onClick={() => setConfirm(null)}>
                Avbryt
              </button>
              <button
                className="hp-btn red"
                onClick={() => {
                  if (confirm === 'nytt') s.newGameSamePlayers();
                  else s.resetAll();
                  setConfirm(null);
                  setMenu(false);
                }}
              >
                Ja, {confirm === 'nytt' ? 'nytt spill' : 'slett alt'}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function SingleScreen({ audio }: { audio: boolean }) {
  const s = useGame();
  const ui = useUi();
  const [drawer, setDrawer] = useState(false);
  const primary = primaryStep(s);
  const back = backStep(s);
  return (
    <div className="single">
      <ShowStage interactive audio={audio} />
      {!ui.hostBarHidden && (
        <>
          <div className="host-bar">
            <button className="hp-btn" onClick={back?.run} disabled={!back}>
              ←
            </button>
            {primary && s.scene === 'runde' && (
              <button className="hp-btn gold" onClick={primary.run} disabled={primary.disabled}>
                {primary.label} →
              </button>
            )}
            <button className={`hp-btn ${drawer ? 'active' : ''}`} onClick={() => setDrawer(!drawer)}>
              🎛 Poeng og kontroller
            </button>
            <button className="hp-btn" onClick={() => s.toggleScoreboard()}>
              📊
            </button>
            <button className="hp-btn" onClick={() => s.togglePause()}>
              {s.paused ? '▶' : '⏸'}
            </button>
            <button className="hp-btn" onClick={() => s.toggleSound()}>
              {s.settings.sound ? '🔊' : '🔇'}
            </button>
            <button className="hp-btn" onClick={() => ui.toggleHostBar()} title="Skjul (H)">
              Skjul
            </button>
            <button className="hp-btn" onClick={() => ui.setSingleScreen(false)} title="Tilbake til panelet (Esc)">
              ✕ Panel
            </button>
          </div>
          {drawer && (
            <div className="host-bar-drawer">
              {/* På én skjerm ser familien det samme som programlederen, så fasit vises aldri her. */}
              <RoundControls hideAnswers />
              <TimerCard />
              <ScoreCard compact />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ResumeModal({ onClose }: { onClose: () => void }) {
  const s = useGame();
  return (
    <div className="modal-back">
      <div className="modal">
        <h2>Fortsette showet?</h2>
        <p>Det ligger et spill i gang med {s.players.map((p) => p.name).join(', ')}.</p>
        <div className="hp-row">
          <button
            className="hp-btn"
            onClick={() => {
              s.newGameSamePlayers();
              onClose();
            }}
          >
            Nytt spill
          </button>
          <button className="hp-btn gold" onClick={onClose}>
            Fortsett spillet
          </button>
        </div>
      </div>
    </div>
  );
}

export function openTvWindow() {
  const url = `${location.pathname}?vindu=tv`;
  window.open(url, 'julegameshow-tv', 'popup,width=1280,height=720');
}

function useTvConnected() {
  const last = useUi((s) => s.tvLastSeen);
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 1500);
    return () => clearInterval(id);
  }, []);
  return isTvConnected(last);
}

/** Når timeren går ut: «TIDEN ER UTE!». De siste fem sekundene tikker det. */
function useTimerWatcher() {
  useEffect(() => {
    let lastSec = -1;
    const id = setInterval(() => {
      const s = useGame.getState();
      if (!s.timer.endsAt) return;
      const left = s.timer.endsAt - Date.now();
      const sec = Math.ceil(left / 1000);
      if (left <= 0) {
        s.patch({ timer: { ...s.timer, endsAt: null, remainingMs: 0 } });
        s.showFx({ kind: 'tid', title: 'TIDEN ER UTE! ⏰', subtitle: 'Penner ned, alle sammen' });
        s.playSound('drama');
        lastSec = -1;
      } else if (sec <= 5 && sec !== lastSec) {
        lastSec = sec;
        s.playSound('tikk');
      }
    }, 200);
    return () => clearInterval(id);
  }, []);
}

function useShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable || e.metaKey || e.ctrlKey || e.altKey) return;
      const s = useGame.getState();
      const ui = useUi.getState();
      const key = e.key.toLowerCase();
      if (key === ' ' || key === 'arrowright' || key === 'pagedown') {
        const p = primaryStep(s);
        if (p && !p.disabled) p.run();
      } else if (key === 'arrowleft' || key === 'pageup') backStep(s)?.run();
      else if (key === 's') s.toggleScoreboard();
      else if (key === 'p') s.togglePause();
      else if (key === 'm') s.toggleSound();
      else if (key === 't' && s.timer.durationMs > 0) s.timer.endsAt ? s.pauseTimer() : s.startTimer();
      else if (key === 'h' && ui.singleScreen) ui.toggleHostBar();
      else if (key === 'escape' && ui.singleScreen) ui.setSingleScreen(false);
      else if (key === 'f' && ui.singleScreen) toggleFullscreen();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

export function toggleFullscreen() {
  if (document.fullscreenElement) void document.exitFullscreen();
  else void document.documentElement.requestFullscreen?.().catch(() => {});
}
