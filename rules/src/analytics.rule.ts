// US equity and bond markets trade about 252 days a year; daily figures are annualized by this count.
export const TRADING_DAYS_PER_YEAR = 252;
// A market snapshot reads the calendar year of closes ending at its asOf.
export const SNAPSHOT_WINDOW_DAYS = 365;
// Fewer daily returns than this give a covariance too noisy to publish; the snapshot is skipped instead.
export const SNAPSHOT_MIN_OBSERVATIONS = 30;
