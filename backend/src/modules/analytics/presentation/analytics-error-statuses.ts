import { ANALYTICS_ERROR_CODES as C, type AnalyticsErrorCode } from '@wealth-advisor/rules';

// HTTP status for every analytics error code. Typed as a full Record, so a new code without a status fails typecheck.
export const ANALYTICS_ERROR_STATUSES: Readonly<Record<AnalyticsErrorCode, number>> = {
  [C.noSnapshot]: 404,
  [C.invariantViolated]: 500,
};
