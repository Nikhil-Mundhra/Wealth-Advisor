// Calendar dates as YYYY-MM-DD strings in UTC: they compare correctly as strings and carry no zone.
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;

export function toIsoDate(instant: Date): string {
  return instant.toISOString().slice(0, 10);
}

// A pattern match like 2025-13-01 parses to NaN (toISOString would throw); 2025-02-30 rolls over to March.
export function isIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const time = Date.parse(`${value}T00:00:00Z`);
  return !Number.isNaN(time) && toIsoDate(new Date(time)) === value;
}

export function addDays(date: string, days: number): string {
  return toIsoDate(new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS));
}
