import { useMutation } from '@tanstack/react-query';
import type { OptimizePortfolioRequest, RebalanceProposalResponse } from '@wealth-advisor/contracts';
import { wealthApi } from './wealth-api.ts';

export const OPTIMIZE_PORTFOLIO_KEY = ['wealth', 'optimize'] as const;

// Proposes a rebalance from the stored portfolio's own drift via the backend optimizer.
export function useOptimize() {
  return useMutation<RebalanceProposalResponse, Error, OptimizePortfolioRequest | undefined>({
    mutationKey: OPTIMIZE_PORTFOLIO_KEY,
    mutationFn: (body) => wealthApi.optimize(body),
  });
}
