import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Backdrop } from './Backdrop';
import { Snow } from './Snow';

export const STAGE_W = 1920;
export const STAGE_H = 1080;

/**
 * TV-lerretet. Alt tegnes i 1920×1080 og skaleres til vinduet, så showet ser
 * likt ut på laptop, Chromecast og 4K-TV.
 */
export function Stage({ children, snow = true }: { children: ReactNode; snow?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => setScale(Math.min(el.clientWidth / STAGE_W, el.clientHeight / STAGE_H));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="stage-viewport" ref={ref}>
      <div className="stage" style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
        <Backdrop />
        {snow && <Snow />}
        <div className="stage-content">{children}</div>
      </div>
    </div>
  );
}
