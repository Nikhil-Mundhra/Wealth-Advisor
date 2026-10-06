// Emergency-runway bands: critical below 3 months, warning up to 6, healthy above.
// Source: CFP Board Financial Planning Practice Guidelines (2022) and US Federal Reserve
// SHED benchmarks recommending 3 to 6 months of non-discretionary expenses in liquid reserves.
export const RUNWAY_CRITICAL_MONTHS = 3;
export const RUNWAY_HEALTHY_MONTHS = 6;

// Baseline monthly expenditure estimates (EUR) used when transaction feeds are absent.
export const DEFAULT_INDIVIDUAL_BURN_ESTIMATE = 2500;
export const DEFAULT_FAMILY_BURN_ESTIMATE = 5000;

export type RunwayBand = 'critical' | 'warning' | 'healthy';

export function runwayBand(months: number): RunwayBand {
  // Non-finite input is the worst case, never the best.
  if (!Number.isFinite(months) || months < RUNWAY_CRITICAL_MONTHS) return 'critical';
  if (months <= RUNWAY_HEALTHY_MONTHS) return 'warning';
  return 'healthy';
}
