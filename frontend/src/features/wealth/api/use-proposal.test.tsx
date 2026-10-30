import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useOptimize } from './use-optimize.ts';
import { useExecuteTrade } from './use-execute-trade.ts';

function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

const proposal = {
  effectiveRiskScore: 6,
  currentWeights: { 'CSPX.LSE': 0.6 },
  targetWeights: { 'CSPX.LSE': 0.4, 'XEON.XET': 0.1 },
  driftPercentages: { 'CSPX.LSE': -20 },
  actions: [{ assetSymbol: 'CSPX.LSE', action: 'SELL' as const, amountBase: 1900000, targetWeight: 0.4 }],
  rationale: { personalFinance: 'p', crossBorder: 'c', wealthStrategy: 'w' },
};

describe('wealth proposal hooks', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('useOptimize proposes a rebalance from the backend optimizer', async () => {
    const seen: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: unknown) => {
        seen.push(String(input));
        return new Response(JSON.stringify(proposal), { status: 200, headers: { 'content-type': 'application/json' } });
      }),
    );
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const { result } = renderHook(() => useOptimize(), { wrapper: wrapper(client) });

    result.current.mutate(undefined);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.actions).toHaveLength(1);
    expect(result.current.data?.actions[0]?.assetSymbol).toBe('CSPX.LSE');
    expect(seen.some((url) => url.endsWith('/api/wealth/optimize'))).toBe(true);
  });

  it('useExecuteTrade commits the optimizer actions, never a hardcoded list', async () => {
    const seenBodies: unknown[] = [];
    const entry = {
      id: 'le_1',
      tenantId: 't1',
      userId: 'u1',
      orderType: 'PORTFOLIO_REBALANCE',
      initialPortfolioStateHash: 'aaa',
      resultingPortfolioStateHash: 'bbb',
      executedTrades: proposal.actions,
      passkeyAssertionProof: {
        credentialId: 'c',
        clientDataJson: 'cd',
        authenticatorData: 'ad',
        signature: 'sig',
        verifiedAt: '2026-09-30T18:42:00.000Z',
      },
      auditDigest: 'digest',
      transactionHash: '0xabc',
      status: 'COMMITTED',
      timestamp: '2026-09-30T18:42:00.000Z',
    };
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_input: unknown, init?: RequestInit) => {
        seenBodies.push(JSON.parse(String(init?.body)));
        return new Response(JSON.stringify({ ledgerEntry: entry, success: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }),
    );
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const { result } = renderHook(() => useExecuteTrade(), { wrapper: wrapper(client) });

    const assertion = { credentialId: 'c', clientDataJson: 'cd', authenticatorData: 'ad', signature: 'sig' };
    result.current.mutate({ orderType: 'PORTFOLIO_REBALANCE', trades: proposal.actions, passkeyAssertion: assertion });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(seenBodies).toHaveLength(1);
    expect(seenBodies[0]).toMatchObject({ trades: proposal.actions });
  });
});
