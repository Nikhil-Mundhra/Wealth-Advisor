import { useEffect, useRef, useState } from 'react';
import { ArrowUp, ArrowDown, Zap } from 'lucide-react';
import type { Currency } from '@wealth-advisor/rules';
import { getDenominationTiers, getTierFromMomentum } from '../lib/currency-denominations.ts';
import { cn } from '../../../lib/cn.ts';

interface CurrencyScrollInputProps {
  id: string;
  value: number | undefined;
  currency: Currency | string;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
  className?: string;
  min?: number;
}

export function CurrencyScrollInput({
  id,
  value,
  currency,
  onChange,
  placeholder = '0',
  className,
  min = 0,
}: CurrencyScrollInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [scrollBadge, setScrollBadge] = useState<{
    step: number;
    direction: 1 | -1;
    tier: number;
  } | null>(null);

  const badgeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const momentumTracker = useRef<{ lastTime: number; lastSpeed: number }>({
    lastTime: 0,
    lastSpeed: 0,
  });

  const tiers = getDenominationTiers(currency);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      // Prevent default page scroll to allow smooth numerical wheel adjustment
      e.preventDefault();

      const now = performance.now();
      const dt = Math.max(10, Math.min(now - momentumTracker.current.lastTime, 400));
      const absDelta = Math.abs(e.deltaY);

      // Instantaneous normalized velocity
      const instantaneousSpeed = (absDelta / dt) * 16;
      const isConsecutive = now - momentumTracker.current.lastTime < 250;
      const momentum = isConsecutive
        ? Math.min(momentumTracker.current.lastSpeed * 0.7 + instantaneousSpeed * 0.5, 300)
        : instantaneousSpeed;

      momentumTracker.current = { lastTime: now, lastSpeed: momentum };

      // Determine denomination tier based on scroll speed
      let tier = getTierFromMomentum(momentum);
      if (e.shiftKey) tier = Math.min(4, tier + 2);
      if (e.altKey) tier = 0;

      const step = tiers[tier];
      const direction: 1 | -1 = e.deltaY < 0 ? 1 : -1;
      const currentVal = value ?? 0;

      let nextVal: number;
      if (direction > 0) {
        // If jumping up from 0, snap directly to step
        if (currentVal === 0) {
          nextVal = step;
        } else {
          nextVal = currentVal + step;
        }
      } else {
        nextVal = Math.max(min, currentVal - step);
      }

      onChange(nextVal === 0 && (value === undefined || value === 0) ? undefined : nextVal);

      // Show temporary scroll denomination feedback pill
      setScrollBadge({ step, direction, tier });
      if (badgeTimerRef.current) clearTimeout(badgeTimerRef.current);
      badgeTimerRef.current = setTimeout(() => {
        setScrollBadge(null);
      }, 850);
    };

    // Attach non-passive wheel listener
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
      if (badgeTimerRef.current) clearTimeout(badgeTimerRef.current);
    };
  }, [value, currency, min, onChange, tiers]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const direction: 1 | -1 = e.key === 'ArrowUp' ? 1 : -1;
      let tier = 1; // Default arrow step
      if (e.shiftKey) tier = 4; // Shift + Arrow = Fast denomination
      if (e.altKey) tier = 0; // Alt + Arrow = Slow denomination

      const step = tiers[tier];
      const currentVal = value ?? 0;
      const nextVal = direction > 0 ? currentVal + step : Math.max(min, currentVal - step);
      onChange(nextVal);

      setScrollBadge({ step, direction, tier });
      if (badgeTimerRef.current) clearTimeout(badgeTimerRef.current);
      badgeTimerRef.current = setTimeout(() => {
        setScrollBadge(null);
      }, 850);
    }
  };

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        id={id}
        type="number"
        min={min}
        value={value ?? ''}
        placeholder={placeholder}
        onKeyDown={handleKeyDown}
        onChange={(e) => {
          const v = e.target.value.trim();
          onChange(v === '' ? undefined : Number(v));
        }}
        className={cn(
          'w-full rounded-field border border-line bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-brand-600 min-h-[44px] transition-all',
          className,
        )}
      />

      {/* Floating Speed Denomination Indicator Badge */}
      {scrollBadge && (
        <div
          role="status"
          aria-live="polite"
          className="absolute -top-7 right-0 z-20 flex items-center gap-1 rounded-full border border-emerald-500/30 bg-surface px-2 py-0.5 text-[10px] font-semibold text-emerald-700 shadow-sm backdrop-blur-xs animate-in fade-in zoom-in-95 dark:border-emerald-500/40 dark:bg-emerald-950/80 dark:text-emerald-300"
        >
          {scrollBadge.direction > 0 ? (
            <ArrowUp aria-hidden className="size-2.5 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
          ) : (
            <ArrowDown aria-hidden className="size-2.5 text-gold stroke-[3]" />
          )}
          <span>
            {scrollBadge.direction > 0 ? '+' : '−'}
            {scrollBadge.step} {currency}
          </span>
          <span className="text-[9px] text-subtle font-mono">
            (Tier {scrollBadge.tier + 1}/5)
          </span>
          {scrollBadge.tier >= 3 && (
            <Zap aria-hidden className="size-2.5 text-gold animate-pulse" />
          )}
        </div>
      )}
    </div>
  );
}
