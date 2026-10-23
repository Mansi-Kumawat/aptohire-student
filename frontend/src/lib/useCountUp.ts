import { useEffect, useState } from 'react';

export function useCountUp(target: number, duration = 900, shouldAnimate = true): number {
  const [current, setCurrent] = useState(shouldAnimate ? 0 : target);

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!shouldAnimate || prefersReducedMotion) {
      setCurrent(target);
      return;
    }

    let startTimestamp: number | null = null;
    let frameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);

      // cubic bezier(0.2, 0.8, 0.2, 1) ease out approximation
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(easeProgress * target));

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      }
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [target, duration, shouldAnimate]);

  return current;
}
