// Emergency-runway bands: critical below 3 months, warning up to 6, healthy above.
export const RUNWAY_CRITICAL_MONTHS = 3;
export const RUNWAY_HEALTHY_MONTHS = 6;

export type RunwayBand = 'critical' | 'warning' | 'healthy';

export function runwayBand(months: number): RunwayBand {
  if (months < RUNWAY_CRITICAL_MONTHS) return 'critical';
  if (months <= RUNWAY_HEALTHY_MONTHS) return 'warning';
  return 'healthy';
}
