import confetti from 'canvas-confetti';
import { useEffect, useRef } from 'react';

const COLORS = ['#f3d98c', '#e7bf5f', '#c9343f', '#f7f0e1', '#2f7a55'];

/** Konfetti inne på TV-lerretet. Fyres hver gang `fire` endrer seg til en ny verdi. */
export function Confetti({ fire, big = false }: { fire: string | number | null; big?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (fire == null || !ref.current) return;
    const shoot = confetti.create(ref.current, { resize: false, useWorker: true });
    ref.current.width = 1920;
    ref.current.height = 1080;
    const burst = (x: number, angle: number) =>
      shoot({ particleCount: big ? 140 : 70, spread: 70, startVelocity: 62, angle, origin: { x, y: 0.9 }, colors: COLORS, scalar: 1.4, ticks: 260 });
    burst(0.1, 60);
    burst(0.9, 120);
    let n = 0;
    const id = big
      ? setInterval(() => {
          shoot({ particleCount: 60, spread: 120, startVelocity: 40, origin: { x: Math.random(), y: -0.05 }, angle: 270, colors: COLORS, scalar: 1.3, ticks: 320, gravity: 0.8 });
          if (++n > 8) clearInterval(id);
        }, 450)
      : undefined;
    return () => {
      clearInterval(id);
      shoot.reset();
    };
  }, [fire, big]);
  return <canvas ref={ref} className="confetti-canvas" aria-hidden />;
}
