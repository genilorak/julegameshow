import { AnimatePresence, motion } from 'framer-motion';
import { ScoreboardView } from '../../scoreboard/Scoreboard';
import type { ControlsProps, StageProps } from '../types';
import { Answer, Pills } from '../shared/ui';
import { BET_STEPS, maxBet, type WagerAction, type WagerQuestion, type WagerState } from './wager';
import { FINAL_QUESTIONS, WAGER_QUESTIONS } from './questions';

const LETTERS = ['A', 'B', 'C', 'D'];
export const wagerQuestion = (id: string): WagerQuestion | undefined => [...WAGER_QUESTIONS, ...FINAL_QUESTIONS].find((q) => q.id === id);

export function WagerStage({ state: s, ctx }: StageProps<WagerState>) {
  const q = wagerQuestion(s.ids[s.index]);
  const title = s.finale ? 'Finalen' : 'Satserunden';

  if (s.phase === 'stilling') {
    return (
      <div className="scene">
        <p className="kicker">Før finalen</p>
        <h1 className="display md">Poengstilling</h1>
        <ScoreboardView contestants={ctx.contestants} scores={ctx.scores} players={ctx.players} showMembers={ctx.mode === 'lag'} />
      </div>
    );
  }
  if (s.phase === 'start') {
    return (
      <div className="scene">
        <motion.p className="kicker" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          Mine damer og herrer
        </motion.p>
        <motion.h1 className="display xl" initial={{ scale: 3, opacity: 0, filter: 'blur(20px)' }} animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}>
          Finalen starter nå
        </motion.h1>
        <motion.p className="subtitle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}>
          Ett spørsmål. Hemmelig innsats. Alt kan skje.
        </motion.p>
      </div>
    );
  }
  if (!q || s.phase === 'ferdig') {
    return (
      <div className="scene">
        <p className="kicker">{title}</p>
        <h1 className="display md">{s.finale ? 'Finalen er over!' : 'Alle innsatser er gjort opp!'}</h1>
        <p className="subtitle">{s.finale ? 'Nå gjenstår bare én ting…' : 'La oss se hvordan det gikk.'}</p>
      </div>
    );
  }

  return (
    <div className="scene quiz">
      <Pills items={[title, !s.finale && `Spørsmål ${s.index + 1} av ${s.ids.length}`, `Kategori: ${q.category}`]} />
      <AnimatePresence mode="wait">
        {s.phase === 'kategori' && (
          <motion.div key="kat" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 120, damping: 14 }}>
            <p className="kicker" style={{ marginTop: 80 }}>Kategorien er</p>
            <h1 className="display">{q.category}</h1>
            <p className="subtitle">Hvor sikre er dere? Gjør klar innsatsen.</p>
          </motion.div>
        )}
        {s.phase === 'innsats' && (
          <motion.div key="inn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <h2 className="headline" style={{ minHeight: 0, marginTop: 20 }}>Skriv innsatsen på lappen!</h2>
            <p className="subtitle" style={{ marginTop: 16 }}>Ingen titting. Programlederen låser innsatsene.</p>
            <BetCards s={s} ctx={ctx} />
          </motion.div>
        )}
        {(s.phase === 'sporsmal' || s.phase === 'svar') && (
          <motion.div key="q" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h2 className="headline">{q.text}</h2>
            {q.options ? (
              <div className="options">
                {q.options.map((o, i) => (
                  <div key={i} className={`option ${s.phase === 'svar' ? (i === q.correct ? 'correct' : 'dim') : ''}`}>
                    <span className="letter">{LETTERS[i]}</span>
                    <span>{o}</span>
                  </div>
                ))}
              </div>
            ) : s.phase === 'svar' ? (
              <motion.div className="free-answer" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 140, damping: 12 }}>
                {q.answer}
              </motion.div>
            ) : (
              <p className="subtitle">Skriv svaret på lappen. Dere har 30 sekunder.</p>
            )}
            {s.phase === 'svar' && q.fact && <p className="quiz-fact">{q.fact}</p>}
          </motion.div>
        )}
        {s.phase === 'avslor' && (
          <motion.div key="av" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <h2 className="headline" style={{ minHeight: 0, marginTop: 10 }}>Svaret var: {q.answer}</h2>
            <BetCards s={s} ctx={ctx} reveal />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BetCards({ s, ctx, reveal = false }: { s: WagerState; ctx: StageProps<WagerState>['ctx']; reveal?: boolean }) {
  const list = reveal ? s.order.map((id) => ctx.contestants.find((c) => c.id === id)!).filter(Boolean) : ctx.contestants;
  return (
    <div className="bet-grid" style={{ ['--cols' as string]: Math.min(5, list.length) }}>
      {list.map((c, i) => {
        const bet = s.bets[c.id];
        const open = reveal && i < s.revealed;
        const right = !!s.right[c.id];
        return (
          <div key={c.id} className="bet-card-wrap">
            <motion.div className={`bet-card ${open ? 'open' : ''}`} animate={{ rotateY: open ? 180 : 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} style={{ ['--c' as string]: c.color }}>
              <div className="face front">
                <span className="e">{c.emoji}</span>
                <span className="n">{c.name}</span>
                <span className="lock">{bet !== undefined ? '🔒 Låst' : 'Venter…'}</span>
              </div>
              <div className={`face back ${right ? 'win' : 'lose'}`}>
                <span className="n">{c.name}</span>
                <span className="amount">{(bet ?? 0).toLocaleString('nb-NO')}</span>
                <span className="res">{bet ? (right ? `✓ +${bet}` : `✗ −${bet}`) : 'Satset ingenting'}</span>
              </div>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}

export function WagerControls({ state: s, ctx, api, showAnswers }: ControlsProps<WagerState, WagerAction>) {
  const q = wagerQuestion(s.ids[s.index]);
  if (!q || s.phase === 'stilling' || s.phase === 'start' || s.phase === 'ferdig') return <p className="hp-note">Trykk på hovedknappen for å gå videre.</p>;
  const answerText = q.options && q.correct !== undefined ? `${LETTERS[q.correct]} · ${q.answer}` : q.answer;
  return (
    <div className="hp-stack">
      {(s.phase === 'kategori' || s.phase === 'innsats') && (
        <div>
          <span className="hp-label">Innsatser (maks = poengsummen, minst 100)</span>
          {ctx.contestants.map((c) => {
            const max = maxBet(ctx.scores[c.id] ?? 0);
            return (
              <div key={c.id} className="score-line">
                <span className="who">
                  {c.emoji} {c.name} <span className="hp-note">({ctx.scores[c.id] ?? 0} p)</span>
                </span>
                <span className="pts">{s.bets[c.id] ?? '–'}</span>
                <div className="adj">
                  {BET_STEPS.filter((b) => b <= max).map((b) => (
                    <button key={b} className={`hp-btn small ${s.bets[c.id] === b ? 'active' : ''}`} onClick={() => api.dispatch({ type: 'bet', contestantId: c.id, amount: b })}>
                      {b}
                    </button>
                  ))}
                  <button className={`hp-btn small red ${s.bets[c.id] === max ? 'active' : ''}`} onClick={() => api.dispatch({ type: 'bet', contestantId: c.id, amount: max })}>
                    Alt ({max})
                  </button>
                  <input
                    className="hp-input"
                    style={{ minHeight: 36, fontSize: 14, maxWidth: 100 }}
                    inputMode="numeric"
                    placeholder="Annet"
                    onKeyDown={(e) => {
                      if (e.key !== 'Enter') return;
                      const v = parseInt((e.target as HTMLInputElement).value, 10);
                      if (!Number.isNaN(v)) api.dispatch({ type: 'bet', contestantId: c.id, amount: v });
                      (e.target as HTMLInputElement).value = '';
                    }}
                    aria-label={`Annen innsats for ${c.name}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
      {(s.phase === 'sporsmal' || s.phase === 'svar' || s.phase === 'avslor') && (
        <>
          <p className="hp-note" style={{ color: 'var(--cream)' }}>{q.text}</p>
          <Answer show={showAnswers || s.phase !== 'sporsmal'}>{answerText}</Answer>
          {s.phase === 'sporsmal' && (
            <button className="hp-btn small" onClick={() => api.startTimer(30_000)}>
              ⏱ 30 sek til å skrive
            </button>
          )}
          <div>
            <span className="hp-label">Hvem svarte riktig? (gjøres før innsatsene avsløres)</span>
            <div className="hp-chips">
              {ctx.contestants.map((c) => (
                <button
                  key={c.id}
                  className={`hp-chip ${s.right[c.id] ? 'on' : ''}`}
                  style={{ ['--c' as string]: c.color }}
                  disabled={s.phase === 'avslor' && s.order.indexOf(c.id) < s.revealed}
                  onClick={() => api.dispatch({ type: 'right', contestantId: c.id, right: !s.right[c.id] })}
                >
                  {s.right[c.id] ? '✓' : '✗'} {c.emoji} {c.name} · {s.bets[c.id] ?? 0}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
