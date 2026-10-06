import { FINANCE_ERROR_CODES, type FinanceErrorCode } from '@wealth-advisor/rules';

export const FINANCE_ERROR_STATUSES: Readonly<Record<FinanceErrorCode, number>> = {
  [FINANCE_ERROR_CODES.accountNotFound]: 404,
  [FINANCE_ERROR_CODES.unsupportedCurrency]: 400,
  [FINANCE_ERROR_CODES.invariantViolated]: 500,
};
