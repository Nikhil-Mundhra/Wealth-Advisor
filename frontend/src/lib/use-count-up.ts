import { useEffect, useState } from 'react';

// Eased count-up for hero money numbers; jumps straight with reduced motion.
export function useCountUp(target: number, durationMs = 900): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target);
      return;
    }
    // Interval, not rAF: identical smoothness for a number tween, and it runs in every environment.
    const start = performance.now();
    const timer = window.setInterval(() => {
      // Clamped: timer and performance timestamps can skew past each other.
      const progress = Math.min(Math.max((performance.now() - start) / durationMs, 0), 1);
      setValue(target * (1 - Math.pow(1 - progress, 3)));
      if (progress >= 1) window.clearInterval(timer);
    }, 16);
    return () => window.clearInterval(timer);
  }, [target, durationMs]);
  return value;
}
