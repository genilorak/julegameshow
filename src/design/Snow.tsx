import { useEffect, useRef } from 'react';

/** Rolige snøfnugg på et eget lerret. Dempet, så de ikke stjeler fokus. */
export function Snow({ count = 90 }: { count?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const W = (canvas.width = 1920);
    const H = (canvas.height = 1080);
    const flakes = Array.from({ length: count }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 1 + Math.random() * 3.2,
      s: 0.3 + Math.random() * 0.9,
      w: Math.random() * Math.PI * 2,
    }));
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(50, now - last) / 16;
      last = now;
      ctx.clearRect(0, 0, W, H);
      for (const f of flakes) {
        f.y += f.s * dt;
        f.w += 0.01 * dt;
        f.x += Math.sin(f.w) * 0.4 * dt;
        if (f.y > H + 6) {
          f.y = -6;
          f.x = Math.random() * W;
        }
        ctx.beginPath();
        ctx.fillStyle = `rgba(255,255,255,${0.15 + f.r / 9})`;
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [count]);

  return <canvas ref={ref} className="snow" aria-hidden />;
}
