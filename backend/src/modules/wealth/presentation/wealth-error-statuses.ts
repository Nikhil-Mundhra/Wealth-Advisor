import { WEALTH_ERROR_CODES, type WealthErrorCode } from '@wealth-advisor/rules';

export const WEALTH_ERROR_STATUSES: Readonly<Record<WealthErrorCode, number>> = {
  [WEALTH_ERROR_CODES.portfolioNotFound]: 404,
  [WEALTH_ERROR_CODES.productNotFound]: 404,
  [WEALTH_ERROR_CODES.passkeyRequired]: 401,
  [WEALTH_ERROR_CODES.passkeyInvalid]: 403,
  [WEALTH_ERROR_CODES.tradeNotPermitted]: 403,
  [WEALTH_ERROR_CODES.invariantViolated]: 500,
};
