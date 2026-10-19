import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ConstructPortfolioRequest, ConstructPortfolioResponse } from '@wealth-advisor/contracts';
import { wealthApi } from './wealth-api.ts';

export const CONSTRUCT_PORTFOLIO_KEY = ['wealth', 'construct'] as const;

export function useConstructPortfolio() {
  const queryClient = useQueryClient();

  return useMutation<ConstructPortfolioResponse, Error, ConstructPortfolioRequest | undefined>({
    mutationFn: (request?: ConstructPortfolioRequest) => wealthApi.constructPortfolio(request),
    onSuccess: (data) => {
      queryClient.setQueryData(CONSTRUCT_PORTFOLIO_KEY, data);
    },
  });
}
