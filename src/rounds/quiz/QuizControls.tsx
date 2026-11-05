import type { ControlsProps } from '../types';
import { pointsFor, questionById, type QuizAction, type QuizState } from './logic';

const LETTERS = ['A', 'B', 'C', 'D'];

export function QuizControls({ state, ctx, api, showAnswers }: ControlsProps<QuizState, QuizAction>) {
  const q = state.index < state.ids.length ? questionById(state.ids[state.index]) : undefined;
  if (!q) return <p className="hp-note">Quizen er ferdig. Trykk «Vis poengtavla» for å gå videre.</p>;
  const marks = state.marks[state.index] ?? {};
  const pts = pointsFor(q);

  const toggle = (cid: string) => {
    const existing = marks[cid];
    if (existing) {
      api.revoke(existing);
      api.dispatch({ type: 'unmark', contestantId: cid });
    } else {
      const eventId = api.award(cid, pts, `Julequiz: ${q.text.slice(0, 40)}`);
      api.dispatch({ type: 'mark', contestantId: cid, eventId });
    }
  };

  return (
    <div className="hp-stack">
      {showAnswers ? (
        <div className="hp-answer">
          <span className="hp-label">Fasit</span>
          <strong>
            {LETTERS[q.correct]} · {q.options[q.correct]}
          </strong>
        </div>
      ) : (
        <p className="hp-note">Fasit er skjult. Trykk «Vis svar» for å avsløre den for alle.</p>
      )}

      <div>
        <span className="hp-label">Hvem hadde rett? (+{pts})</span>
        <div className="hp-chips">
          {ctx.contestants.map((c) => (
            <button key={c.id} className={`hp-chip ${marks[c.id] ? 'on' : ''}`} onClick={() => toggle(c.id)} style={{ ['--c' as string]: c.color }}>
              {c.emoji} {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="hp-row">
        <button className="hp-btn" onClick={() => api.startTimer(30_000)}>
          ⏱ 30 sek
        </button>
        <button
          className="hp-btn"
          onClick={() => {
            api.sound('feil');
            api.fx({ kind: 'au', title: '😬 DEN VAR VOND.', subtitle: q.difficulty === 1 ? 'Og det var et av de lette…' : 'Ingen fikk den til' });
          }}
        >
          😬 Ingen hadde rett
        </button>
      </div>
    </div>
  );
}
