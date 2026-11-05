# 🎄 Familiens store juleshow

Et norsk julegameshow for familien, laget for å vises på TV-en mens én person er programleder fra laptopen.
4–10 spillere, ingen telefoner, ingen innlogging.

## Slik spiller dere

1. Åpne siden på laptopen. Dette er **programlederpanelet**.
2. Velg hvordan showet skal vises på TV-en:
   - **HDMI som egen skjerm:** trykk «📺 Åpne TV-vindu», dra vinduet over på TV-en og klikk i det for fullskjerm.
   - **Chromecast:** trykk «📺 Åpne TV-vindu», og velg «Cast fane» i Chrome-menyen på det nye vinduet. Lyden følger med.
   - **HDMI speilet (samme bilde på begge):** trykk «🖥 Én skjerm». Da styrer du fra en liten kontrollstripe nederst, og fasiten er skjult.
3. Legg inn spillerne, velg alle mot alle eller lag, og trykk deg videre.

Med to vinduer ser bare programlederen fasiten. Krysser du av for «Programlederen spiller med», skjules fasiten også på laptopen.

### Hurtigtaster (programleder)

| Tast | Gjør |
| --- | --- |
| Mellomrom / → | Neste |
| ← | Tilbake |
| S | Vis/skjul poengtavla på TV |
| T | Start/stopp timer |
| P | Pause |
| M | Lyd av/på |
| H / Esc / F | Én skjerm: skjul kontroller / tilbake til panelet / fullskjerm |

## Utvikling

```bash
npm install
npm run dev     # lokal utviklingsserver
npm test        # poengmotor, lag, spillflyt og quiz
npm run build   # bygger til dist/
```

Appen er en ren nettleserapp (React + TypeScript + Vite + Zustand). Spillet lagres i `localStorage`, så det overlever en refresh.
TV-vinduet og programlederpanelet snakker sammen via `BroadcastChannel`, uten server.

### Struktur

```
src/
  core/        spilltilstand (store), poengmotor, lag, dreiebok (flow), synk mellom vinduer
  design/      TV-lerret (1920×1080 skalert), bakgrunn, snø, konfetti, timer, animerte tall
  scenes/      scenene på TV-en
  scoreboard/  poengtavla
  host/        programlederpanelet og én-skjerm-modus
  tv/          TV-vinduet
  rounds/      én mappe per runde + registry.ts
  sound/       SoundManager med lyder laget i Web Audio
```

### Legge til en ny runde

1. Lag en ny mappe under `src/rounds/` som eksporterer en `RoundDefinition` (se `src/rounds/types.ts` og `src/rounds/quiz/`).
2. Legg den til i `src/rounds/registry.ts`.

Resten av showet (rundeintro, poengtavle, tilbake/neste, lagring) virker automatisk.
