import { useId } from 'react';

interface AreaChartProps {
  points: number[];
  label: string;
}

// Minimal SVG area chart: smooth path through the points with a gradient fill and an endpoint dot.
export function AreaChart({ points, label }: AreaChartProps) {
  const gradientId = `${useId()}-area`;
  if (points.length === 0) return null;
  const series = points.length === 1 ? [points[0], points[0]] : points;
  const width = 300;
  const height = 110;
  const max = Math.max(...series);
  const min = Math.min(...series);
  const span = max - min || 1;
  const coords = series.map((value, index) => {
    const x = (index / (series.length - 1)) * width;
    const y = height - 10 - ((value - min) / span) * (height - 20);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const line = `M${coords.join(' L')}`;
  const [lastX, lastY] = coords[coords.length - 1].split(',');
  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} className="h-28 w-full">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--color-chart-1)" stopOpacity="0.45" />
          <stop offset="1" stopColor="var(--color-chart-1)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${width},${height} L0,${height} Z`} fill={`url(#${gradientId})`} />
      <path d={line} fill="none" stroke="var(--color-chart-1)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx={lastX} cy={lastY} r="4" fill="var(--color-chart-2)" />
    </svg>
  );
}
