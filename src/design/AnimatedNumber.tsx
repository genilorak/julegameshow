import { animate, useMotionValue, useTransform, motion } from 'framer-motion';
import { useEffect } from 'react';

/** Tall som ruller opp eller ned når poengene endres. */
export function AnimatedNumber({ value, duration = 1.1 }: { value: number; duration?: number }) {
  const mv = useMotionValue(value);
  const text = useTransform(mv, (v) => Math.round(v).toLocaleString('nb-NO'));
  useEffect(() => {
    const controls = animate(mv, value, { duration, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [value, duration, mv]);
  return <motion.span>{text}</motion.span>;
}
