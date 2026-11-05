// Alle lydeffekter lages i nettleseren med Web Audio. Ingen lydfiler, ingen rettigheter.
// Lyd brukes bare på viktige øyeblikk: intro, svar, poeng, drama, finale og seier.
import type { SoundName } from '../core/types';

type Ctx = AudioContext;

const NOTE: Record<string, number> = {
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0, B5: 987.77,
  C6: 1046.5, E6: 1318.5, G6: 1568.0, C3: 130.81, G3: 196.0, E3: 164.81, A3: 220.0, F3: 174.61,
};

class SoundManagerImpl {
  private ctx: Ctx | null = null;
  private master: GainNode | null = null;
  enabled = true;

  /** Må kalles fra et klikk eller tastetrykk, ellers blokkerer nettleseren lyd. */
  unlock() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.55;
      const comp = this.ctx.createDynamicsCompressor();
      this.master.connect(comp).connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  get ready() {
    return !!this.ctx && this.ctx.state === 'running';
  }

  play(name: SoundName) {
    if (!this.enabled || !this.ctx || !this.master) return;
    const t = this.ctx.currentTime + 0.02;
    try {
      SOUNDS[name]?.(this.ctx, this.master, t);
    } catch {
      // En lyd som feiler skal aldri stoppe showet.
    }
  }
}

// ───────────── Byggeklosser ─────────────

function tone(ctx: Ctx, out: AudioNode, freq: number, t: number, dur: number, opts: { type?: OscillatorType; gain?: number; attack?: number; detune?: number; filter?: number } = {}) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = opts.type ?? 'sine';
  osc.frequency.value = freq;
  if (opts.detune) osc.detune.value = opts.detune;
  const peak = opts.gain ?? 0.3;
  const a = opts.attack ?? 0.008;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let node: AudioNode = osc;
  if (opts.filter) {
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = opts.filter;
    osc.connect(f);
    node = f;
  }
  node.connect(g).connect(out);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

/** Klokkeklang: grunntone + overtoner som dør ut. */
function bell(ctx: Ctx, out: AudioNode, freq: number, t: number, dur = 1.4, gain = 0.22) {
  tone(ctx, out, freq, t, dur, { gain });
  tone(ctx, out, freq * 2.01, t, dur * 0.6, { gain: gain * 0.35 });
  tone(ctx, out, freq * 3.02, t, dur * 0.35, { gain: gain * 0.15 });
}

/** Messingaktig akkord til fanfarer. */
function brass(ctx: Ctx, out: AudioNode, freq: number, t: number, dur: number, gain = 0.12) {
  tone(ctx, out, freq, t, dur, { type: 'sawtooth', gain, attack: 0.04, filter: 2200 });
  tone(ctx, out, freq, t, dur, { type: 'sawtooth', gain: gain * 0.7, attack: 0.04, filter: 2200, detune: 8 });
}

function noise(ctx: Ctx, out: AudioNode, t: number, dur: number, opts: { gain?: number; hp?: number; lp?: number; attack?: number } = {}) {
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const g = ctx.createGain();
  const peak = opts.gain ?? 0.2;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + (opts.attack ?? 0.005));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let node: AudioNode = src;
  if (opts.hp) {
    const f = ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = opts.hp;
    node.connect(f);
    node = f;
  }
  if (opts.lp) {
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = opts.lp;
    node.connect(f);
    node = f;
  }
  node.connect(g).connect(out);
  src.start(t);
}

function sleighBells(ctx: Ctx, out: AudioNode, t: number, dur: number, gain = 0.06) {
  for (let i = 0; i < dur / 0.11; i++) noise(ctx, out, t + i * 0.11, 0.08, { gain: gain * (i % 2 ? 0.6 : 1), hp: 7000 });
}

function drum(ctx: Ctx, out: AudioNode, t: number, gain = 0.6, freq = 110) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.frequency.setValueAtTime(freq, t);
  osc.frequency.exponentialRampToValueAtTime(40, t + 0.4);
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
  osc.connect(g).connect(out);
  osc.start(t);
  osc.stop(t + 0.55);
}

// ───────────── Lydene ─────────────

const SOUNDS: Record<SoundName, (ctx: Ctx, out: AudioNode, t: number) => void> = {
  klikk: (ctx, out, t) => tone(ctx, out, 1800, t, 0.05, { type: 'triangle', gain: 0.08 }),

  whoosh: (ctx, out, t) => {
    const len = 0.5;
    const src = ctx.createBufferSource();
    const buf = ctx.createBuffer(1, ctx.sampleRate * len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.Q.value = 1.2;
    f.frequency.setValueAtTime(300, t);
    f.frequency.exponentialRampToValueAtTime(3500, t + len * 0.8);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.15);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    src.connect(f).connect(g).connect(out);
    src.start(t);
  },

  riktig: (ctx, out, t) => {
    [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6].forEach((f, i) => bell(ctx, out, f, t + i * 0.08, 1.1, 0.18));
  },

  feil: (ctx, out, t) => {
    tone(ctx, out, 220, t, 0.32, { type: 'sawtooth', gain: 0.14, filter: 900 });
    tone(ctx, out, 165, t + 0.3, 0.6, { type: 'sawtooth', gain: 0.14, filter: 700 });
  },

  poeng: (ctx, out, t) => {
    bell(ctx, out, NOTE.E6, t, 0.5, 0.12);
    bell(ctx, out, NOTE.G6, t + 0.07, 0.7, 0.1);
  },

  tikk: (ctx, out, t) => tone(ctx, out, 1200, t, 0.04, { type: 'square', gain: 0.05, filter: 3000 }),

  trommevirvel: (ctx, out, t) => {
    const dur = 1.8;
    for (let i = 0; i < dur / 0.045; i++) {
      const p = i / (dur / 0.045);
      noise(ctx, out, t + i * 0.045, 0.06, { gain: 0.04 + p * 0.16, lp: 1800, hp: 200 });
    }
    drum(ctx, out, t + dur, 0.5, 90);
    noise(ctx, out, t + dur, 1.4, { gain: 0.16, hp: 5000 });
  },

  reveal: (ctx, out, t) => {
    [NOTE.C4, NOTE.G4, NOTE.E5, NOTE.C5].forEach((f) => tone(ctx, out, f, t, 1.6, { type: 'triangle', gain: 0.07, attack: 0.25 }));
    [NOTE.G5, NOTE.C6, NOTE.E6].forEach((f, i) => bell(ctx, out, f, t + 0.3 + i * 0.1, 1.2, 0.08));
  },

  drama: (ctx, out, t) => {
    [0, 0.28, 0.62].forEach((d, i) => {
      drum(ctx, out, t + d, 0.6, 80);
      brass(ctx, out, [NOTE.C3, NOTE.C3, NOTE.F3][i] * 2, t + d, i === 2 ? 1.1 : 0.22, 0.1);
    });
  },

  intro: (ctx, out, t) => {
    // Fanfare + bjeller: C – G – C' og en gyllen avslutning.
    sleighBells(ctx, out, t, 2.6);
    const seq: Array<[number, number, number]> = [
      [NOTE.G4, 0, 0.18], [NOTE.G4, 0.2, 0.18], [NOTE.C5, 0.4, 0.5], [NOTE.E5, 0.95, 0.3], [NOTE.D5, 1.25, 0.25], [NOTE.G5, 1.5, 1.3],
    ];
    seq.forEach(([f, d, len]) => brass(ctx, out, f, t + d, len, 0.11));
    [NOTE.C4, NOTE.E4, NOTE.G4].forEach((f) => brass(ctx, out, f, t + 1.5, 1.3, 0.06));
    drum(ctx, out, t + 1.5, 0.5, 100);
    [NOTE.C6, NOTE.E6, NOTE.G6].forEach((f, i) => bell(ctx, out, f, t + 1.6 + i * 0.09, 1.4, 0.07));
  },

  finale: (ctx, out, t) => {
    [0, 0.5, 1.0, 1.25, 1.5].forEach((d) => drum(ctx, out, t + d, 0.55, 75));
    [NOTE.A3, NOTE.C4, NOTE.E4].forEach((f) => brass(ctx, out, f, t, 1.2, 0.06));
    [NOTE.F3, NOTE.A3, NOTE.C4].forEach((f) => brass(ctx, out, f, t + 1.0, 0.5, 0.07));
    [NOTE.G3, NOTE.B4, NOTE.D5, NOTE.G4].forEach((f) => brass(ctx, out, f, t + 1.5, 1.6, 0.07));
  },

  seier: (ctx, out, t) => {
    sleighBells(ctx, out, t, 3.4, 0.07);
    const seq: Array<[number, number, number]> = [
      [NOTE.C5, 0, 0.15], [NOTE.C5, 0.16, 0.15], [NOTE.C5, 0.32, 0.15], [NOTE.C5, 0.5, 0.45], [NOTE.A4, 0.95, 0.45], [NOTE.B4, 1.4, 0.45], [NOTE.C5, 1.85, 0.3], [NOTE.B4, 2.12, 0.15], [NOTE.C5, 2.3, 1.4],
    ];
    seq.forEach(([f, d, len]) => brass(ctx, out, f, t + d, len, 0.11));
    [NOTE.C4, NOTE.E4, NOTE.G4].forEach((f) => brass(ctx, out, f, t + 2.3, 1.4, 0.06));
    drum(ctx, out, t + 2.3, 0.6, 100);
    [NOTE.C6, NOTE.E6, NOTE.G6, NOTE.C6 * 2].forEach((f, i) => bell(ctx, out, f, t + 2.4 + i * 0.1, 1.6, 0.07));
  },
};

export const SoundManager = new SoundManagerImpl();
