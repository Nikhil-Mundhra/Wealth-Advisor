import { useId, useState } from 'react';
import { formatMoney } from '../../lib/format-money.ts';
import type { Currency } from '@wealth-advisor/rules';

export interface AreaChartPoint {
  label: string;
  value: number;
}

export interface AreaChartProps {
  points: number[] | AreaChartPoint[];
  label: string;
  currency?: Currency | string;
  periodLabel?: string;
  insight?: string;
  timeframe?: '1W' | '1M' | '6M';
  onTimeframeChange?: (timeframe: '1W' | '1M' | '6M') => void;
}

// Full interactive financial time-series graph with insights, gridlines, hover cursor, and dynamic window.
export function AreaChart({
  points,
  label,
  currency = 'EUR',
  periodLabel,
  insight,
  timeframe = '6M',
  onTimeframeChange,
}: AreaChartProps) {
  const gradientId = `${useId()}-area`;
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!points || points.length === 0) return null;

  // Normalize points into { label, value }
  const normalizedPoints: AreaChartPoint[] =
    typeof points[0] === 'number'
      ? (points as number[]).map((val, idx) => ({
          label: `Point ${idx + 1}`,
          value: val,
        }))
      : (points as AreaChartPoint[]);

  const series = normalizedPoints.length === 1
    ? [normalizedPoints[0], normalizedPoints[0]]
    : normalizedPoints;

  const width = 420;
  const height = 140;
  const paddingBottom = 22;
  const paddingTop = 12;
  const graphHeight = height - paddingBottom - paddingTop;

  const values = series.map((p) => p.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;

  const firstValue = values[0];
  const lastValue = values[values.length - 1];
  const diff = lastValue - firstValue;
  const percentChange = firstValue > 0 ? ((diff / firstValue) * 100).toFixed(1) : '0.0';
  const isPositive = diff >= 0;

  const activePoint = hoverIndex !== null ? series[hoverIndex] : series[series.length - 1];

  const coords = series.map((pt, index) => {
    const x = (index / (series.length - 1)) * width;
    const y = paddingTop + graphHeight - ((pt.value - min) / span) * graphHeight;
    return { x, y, pt, index };
  });

  const linePath = `M${coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' L')}`;
  const lastCoord = coords[coords.length - 1];
  const activeCoord = hoverIndex !== null ? coords[hoverIndex] : lastCoord;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, mouseX / rect.width));
    const closestIdx = Math.round(ratio * (series.length - 1));
    setHoverIndex(closestIdx);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  return (
    <div className="flex flex-col gap-2.5">
      {/* Chart Header Stats & Timeframe Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2.5">
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
              isPositive
                ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-800'
                : 'bg-danger/10 text-danger border border-danger/20'
            }`}
          >
            {isPositive ? '↗' : '↘'} {isPositive ? '+' : ''}
            {percentChange}% Trajectory
          </span>
          {hoverIndex !== null ? (
            <span className="text-xs font-medium text-ink motion-safe:animate-fade-in">
              {activePoint.label}: {formatMoney(Math.round(activePoint.value), currency as Currency)}
            </span>
          ) : (
            <span className="text-[11px] text-subtle">
              {periodLabel ?? 'Trailing performance'}
            </span>
          )}
        </div>

        {/* Timeframe Chips */}
        <div className="flex items-center gap-1 rounded-field bg-surface-subtle p-0.5" role="group" aria-label="Timeframe">
          {(['1W', '1M', '6M'] as const).map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => onTimeframeChange?.(tf)}
              aria-pressed={timeframe === tf}
              className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
                timeframe === tf
                  ? 'bg-surface font-semibold text-ink shadow-xs'
                  : 'text-subtle hover:text-ink'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Canvas with Gridlines, Gradient Path, Endpoint, and Hover Tooltip */}
      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={label}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="h-36 w-full cursor-crosshair overflow-visible touch-none"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--color-chart-1)" stopOpacity="0.45" />
              <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Dotted Gridlines */}
          <line
            x1="0"
            y1={paddingTop}
            x2={width}
            y2={paddingTop}
            stroke="var(--color-line)"
            strokeDasharray="3 3"
            strokeOpacity="0.6"
          />
          <line
            x1="0"
            y1={paddingTop + graphHeight / 2}
            x2={width}
            y2={paddingTop + graphHeight / 2}
            stroke="var(--color-line)"
            strokeDasharray="3 3"
            strokeOpacity="0.6"
          />
          <line
            x1="0"
            y1={paddingTop + graphHeight}
            x2={width}
            y2={paddingTop + graphHeight}
            stroke="var(--color-line)"
            strokeDasharray="3 3"
            strokeOpacity="0.6"
          />

          {/* Area Fill & Primary Curve */}
          <path
            d={`${linePath} L${width},${paddingTop + graphHeight} L0,${paddingTop + graphHeight} Z`}
            fill={`url(#${gradientId})`}
          />
          <path
            d={linePath}
            fill="none"
            stroke="var(--color-chart-1)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Hover Vertical Guide Line */}
          {hoverIndex !== null && (
            <line
              x1={activeCoord.x}
              y1={paddingTop}
              x2={activeCoord.x}
              y2={paddingTop + graphHeight}
              stroke="var(--color-chart-2)"
              strokeWidth="1.5"
              strokeDasharray="2 2"
            />
          )}

          {/* Point Dot */}
          <circle
            cx={activeCoord.x}
            cy={activeCoord.y}
            r="4.5"
            fill="var(--color-chart-2)"
            stroke="var(--color-surface)"
            strokeWidth="1.5"
          />

          {/* X-Axis Labels */}
          {coords.map((c, i) => (
            <text
              key={i}
              x={c.x}
              y={height - 4}
              textAnchor={i === 0 ? 'start' : i === coords.length - 1 ? 'end' : 'middle'}
              className="fill-subtle text-[9px] font-mono select-none"
            >
              {c.pt.label}
            </text>
          ))}
        </svg>
      </div>

      {/* Trajectory Financial Insight Banner */}
      {insight && (
        <div className="flex items-start gap-2 rounded-field border border-line bg-surface-subtle p-2.5 text-xs">
          <span className="text-sm select-none" aria-hidden>
            📊
          </span>
          <p className="text-subtle leading-relaxed">
            <strong className="text-ink font-semibold">Insight: </strong>
            {insight}
          </p>
        </div>
      )}
    </div>
  );
}
