import { useQuery } from '@tanstack/react-query';
import { wealthApi } from './wealth-api.ts';

export const PORTFOLIO_QUERY_KEY = ['wealth', 'portfolio'] as const;

export function usePortfolio(enabled = true) {
  return useQuery({
    queryKey: PORTFOLIO_QUERY_KEY,
    queryFn: wealthApi.getPortfolio,
    enabled,
    retry: 1,
    staleTime: 30_000,
  });
}
