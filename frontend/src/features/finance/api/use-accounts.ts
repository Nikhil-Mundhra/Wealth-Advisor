import { useQuery } from '@tanstack/react-query';
import { financeApi } from './finance-api.ts';

export const ACCOUNTS_QUERY_KEY = ['finance', 'accounts'] as const;

export function useAccounts(enabled = true) {
  return useQuery({
    queryKey: ACCOUNTS_QUERY_KEY,
    queryFn: financeApi.getAccounts,
    enabled,
    retry: 1,
    staleTime: 30_000,
  });
}
