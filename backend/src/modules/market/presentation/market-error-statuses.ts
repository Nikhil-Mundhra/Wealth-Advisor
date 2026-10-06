import { MARKET_ERROR_CODES as C, type MarketErrorCode } from '@wealth-advisor/rules';

// HTTP status for every market error code. Typed as a full Record, so a new code without a status fails typecheck.
export const MARKET_ERROR_STATUSES: Readonly<Record<MarketErrorCode, number>> = {
  [C.cronUnauthorized]: 401,
  [C.invariantViolated]: 500,
  [C.providerUnavailable]: 502,
  [C.providerQuotaSpent]: 503,
  [C.providerNotConfigured]: 503,
};
