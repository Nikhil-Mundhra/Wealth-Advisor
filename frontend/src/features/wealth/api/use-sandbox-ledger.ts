import { useQuery } from '@tanstack/react-query';
import { wealthApi } from './wealth-api.ts';

export const SANDBOX_LEDGER_QUERY_KEY = ['wealth', 'ledger'] as const;

export function useSandboxLedger(enabled = true) {
  return useQuery({
    queryKey: SANDBOX_LEDGER_QUERY_KEY,
    queryFn: wealthApi.getLedger,
    enabled,
    retry: 1,
    staleTime: 15_000,
  });
}
