import { AnimatePresence, motion } from 'framer-motion';
import type { ControlsProps, StageProps } from '../types';
import { byId } from '../shared/fair';
import { Answer, PickContestant, TurnBadge } from '../shared/ui';
import { QUIZ_QUESTIONS } from '../quiz/questions';
import { Confetti } from '../../design/Confetti';
import { Emo } from '../../design/Emo';
import { GIFT_INFO, NEEDS_JUDGE, NEEDS_TARGET, type PakkerAction, type PakkerState } from './logic';

const PAPER = ['#a8222d', '#154631', '#c9a24a', '#7a1c4a', '#1f4f7a', '#e7dcc4'];
const RIBBON = ['#f3d98c', '#f3d98c', '#a8222d', '#f3d98c', '#f7f0e1', '#a8222d'];

function GiftBox({ i, size = 200, opened }: { i: number; size?: number; opened?: boolean }) {
  const paper = PAPER[i % PAPER.length];
  const ribbon = RIBBON[i % RIBBON.length];
  return (
    <div className={`gift ${opened ? 'opened' : ''}`} style={{ width: size, height: size, ['--paper' as string]: paper, ['--ribbon' as string]: ribbon }}>
      <div className="gift-lid" />
      <div className="gift-body" />
      <div className="gift-bow" />
      <span className="gift-tag">{i + 1}</span>
    </div>
  );
}

export function PakkerStage({ state: s, ctx }: StageProps<PakkerState>) {
  const me = byId(ctx.contestants, s.order[s.turn]);
  const n = s.gifts.length;
  const size = n <= 6 ? 230 : n <= 8 ? 200 : 180;

  if (s.phase === 'ferdig') {
    return (
      <div className="scene">
        <p className="kicker">Mystiske julepakker</p>
        <h1 className="display md">Alle pakker er åpnet!</h1>
      </div>
    );
  }

  if (s.phase === 'apnet' && s.current !== null) {
    const g = s.gifts[s.current];
    const info = GIFT_INFO[g.kind];
    const target = byId(ctx.contestants, s.target);
    const bonus = s.bonusId ? QUIZ_QUESTIONS.find((q) => q.id === s.bonusId) : undefined;
    return (
      <div className="scene">
        {info.good && <Confetti fire={`${s.turn}-${s.current}`} />}
        <TurnBadge c={me} label="åpner pakke" />
        <motion.div className="gift-stage" initial={{ scale: 0.3, y: 200 }} animate={{ scale: [0.3, 1.25, 1.2, 1.25, 1], rotate: [0, -6, 6, -4, 0], y: 0 }} transition={{ duration: 1.2 }}>
          <GiftBox i={s.current} size={240} opened />
        </motion.div>
        <motion.div className={`gift-result ${info.good === false ? 'bad' : info.good ? 'good' : ''}`} initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.15, type: 'spring', stiffness: 160, damping: 12 }}>
          <span className="e">{info.emoji}</span>
          <h1 className="display md">
            <Emo text={info.title} />
          </h1>
          <p className="subtitle" style={{ marginTop: 12 }}>
            {g.kind === 'utfordring' && s.challenge ? s.challenge : g.kind === 'bonus' && bonus ? bonus.text : info.text}
          </p>
          {g.kind === 'bonus' && bonus && (
            <div className="mini-options">
              {bonus.options.map((o, i) => (
                <span key={i} className={s.resolved && i === bonus.correct ? 'right' : ''}>
                  {'ABCD'[i]}: {o}
                </span>
              ))}
            </div>
          )}
          {target && (
            <p className="fx-sub" style={{ fontSize: 44 }}>
              {g.kind === 'stjel' ? `Offeret: ${target.emoji} ${target.name}` : `Bytter med ${target.emoji} ${target.name}`}
            </p>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="scene" style={{ paddingTop: 70 }}>
      <TurnBadge c={me} label="velger en pakke" />
      <div className="gift-grid" style={{ ['--cols' as string]: n <= 6 ? 3 : n <= 8 ? 4 : 5 }}>
        {s.gifts.map((g, i) => (
          <motion.div key={i} className="gift-cell" initial={{ opacity: 0, y: 60 }} animate={{ opacity: g.openedBy ? 0.35 : 1, y: 0 }} transition={{ delay: i * 0.06, type: 'spring', stiffness: 140, damping: 14 }}>
            {g.openedBy ? (
              <div className="gift-opened" style={{ width: size, height: size }}>
                <span className="e">{GIFT_INFO[g.kind].emoji}</span>
                <span className="t">{GIFT_INFO[g.kind].title}</span>
                <span className="who">{byId(ctx.contestants, g.openedBy)?.emoji}</span>
              </div>
            ) : (
              <motion.div animate={{ rotate: [0, -2, 2, 0] }} transition={{ repeat: Infinity, duration: 3 + (i % 3), delay: i * 0.3 }}>
                <GiftBox i={i} size={size} />
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
      <AnimatePresence />
    </div>
  );
}

export function PakkerControls({ state: s, ctx, api, showAnswers }: ControlsProps<PakkerState, PakkerAction>) {
  const me = byId(ctx.contestants, s.order[s.turn]);
  if (s.phase === 'ferdig') return <p className="hp-note">Alle pakker er åpnet.</p>;
  if (s.phase === 'velg') {
    return (
      <div className="hp-stack">
        <p className="hp-note">
          {me?.emoji} <strong>{me?.name}</strong> velger. Trykk på nummeret de roper.
        </p>
        <div className="hp-chips">
          {s.gifts.map((g, i) => (
            <button key={i} className="hp-btn" style={{ minWidth: 56 }} disabled={!!g.openedBy} onClick={() => api.dispatch({ type: 'pick', index: i })}>
              🎁 {i + 1}
            </button>
          ))}
        </div>
      </div>
    );
  }
  const g = s.gifts[s.current ?? 0];
  const bonus = s.bonusId ? QUIZ_QUESTIONS.find((q) => q.id === s.bonusId) : undefined;
  return (
    <div className="hp-stack">
      <p className="hp-note">
        {me?.name} fikk: <strong>{GIFT_INFO[g.kind].title}</strong>
      </p>
      {NEEDS_TARGET.includes(g.kind) && !s.resolved && (
        <PickContestant
          label={g.kind === 'stjel' ? 'Hvem stjeler de fra?' : 'Hvem bytter de med?'}
          contestants={ctx.contestants}
          disabled={(c) => c.id === me?.id}
          onPick={(id) => api.dispatch({ type: 'target', contestantId: id })}
        />
      )}
      {g.kind === 'bonus' && bonus && <Answer show={showAnswers}>{'ABCD'[bonus.correct]} · {bonus.options[bonus.correct]}</Answer>}
      {NEEDS_JUDGE.includes(g.kind) && !s.resolved && (
        <div className="hp-row">
          <button className="hp-btn gold" onClick={() => api.dispatch({ type: 'resolve', success: true })}>
            ✓ Klarte det (+150)
          </button>
          <button className="hp-btn red" onClick={() => api.dispatch({ type: 'resolve', success: false })}>
            ✗ Klarte det ikke
          </button>
          {g.kind === 'utfordring' && (
            <button className="hp-btn small" onClick={() => api.startTimer(20_000)}>
              ⏱ 20 sek
            </button>
          )}
        </div>
      )}
      {s.resolved && <p className="hp-note">Ferdig. Trykk «Neste tur» for å gå videre.</p>}
    </div>
  );
}
