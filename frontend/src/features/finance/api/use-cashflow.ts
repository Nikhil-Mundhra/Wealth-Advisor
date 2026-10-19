import { useQuery } from '@tanstack/react-query';
import type { HouseholdMode } from '@wealth-advisor/rules';
import { financeApi } from './finance-api.ts';

export const cashflowQueryKey = (householdMode: HouseholdMode) =>
  ['finance', 'cashflow', householdMode] as const;

export function useCashflow(householdMode: HouseholdMode = 'INDIVIDUAL', enabled = true) {
  return useQuery({
    queryKey: cashflowQueryKey(householdMode),
    queryFn: () => financeApi.getCashflow(householdMode),
    enabled,
    retry: 1,
    staleTime: 30_000,
  });
}
