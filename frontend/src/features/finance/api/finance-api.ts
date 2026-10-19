import { AccountListResponse, CashflowSummaryResponse } from '@wealth-advisor/contracts';
import type { HouseholdMode } from '@wealth-advisor/rules';
import { apiRequest } from '../../../lib/api-client.ts';

// Cashflow and multi-currency bank account endpoints, typed by contracts.
export const financeApi = {
  getAccounts: () =>
    apiRequest('/finance/accounts', {
      response: AccountListResponse,
      authenticated: true,
    }),

  getCashflow: (householdMode: HouseholdMode = 'INDIVIDUAL') =>
    apiRequest(`/finance/cashflow?householdMode=${encodeURIComponent(householdMode)}`, {
      response: CashflowSummaryResponse,
      authenticated: true,
    }),
};
