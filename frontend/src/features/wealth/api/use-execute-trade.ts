import { useMutation } from '@tanstack/react-query';
import type { ExecuteTradeRequest, ExecuteTradeResponse } from '@wealth-advisor/contracts';
import { wealthApi } from './wealth-api.ts';

export const EXECUTE_TRADE_KEY = ['wealth', 'execute'] as const;

// Commits a passkey-gated sandbox rebalance built from the optimizer proposal.
export function useExecuteTrade() {
  return useMutation<ExecuteTradeResponse, Error, ExecuteTradeRequest>({
    mutationKey: EXECUTE_TRADE_KEY,
    mutationFn: (body) => wealthApi.executeTrade(body),
  });
}
