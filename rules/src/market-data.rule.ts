// Marketstack free plan: 100 requests per calendar month, end-of-day only, one year of history.
export const MARKETSTACK_MONTHLY_REQUEST_LIMIT = 100;
// Largest page Marketstack serves for /v2/eod.
export const MARKETSTACK_PAGE_LIMIT = 1000;
// Stops a provider whose pagination never ends from spending the whole monthly budget in one refresh.
export const MARKETSTACK_MAX_PAGES = 10;
export const MARKET_HISTORY_DAYS = 365;
export const MARKET_PROVIDER_TIMEOUT_MS = 10_000;
// ECB publishes no rate on weekends and TARGET holidays (longest gap: Good Friday to Easter Monday, plus
// Christmas to New Year); a historical conversion looks this far back for the last published rate.
export const FX_LOOKBACK_DAYS = 10;
