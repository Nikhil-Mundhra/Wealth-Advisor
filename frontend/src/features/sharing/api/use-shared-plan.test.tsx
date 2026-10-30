import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSharedPlan } from './use-shared-plan.ts';

function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('useSharedPlan', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('reads the shared plan from /sharing/:token without inventing holdings', async () => {
    const plan = {
      shareToken: 'plan_AAA',
      ownerDisplayName: 'Alice AAA',
      privacyMasked: true,
      planSnapshot: {
        recommendedWeights: { 'US Tech': 0.6 },
        currentWeights: { 'US Tech': 0.6 },
        threePillarRationale: { personalFinance: 'p', crossBorder: 'c', wealthStrategy: 'w' },
        stressTestScenario: null,
      },
      expiresAt: '2026-10-27T00:00:00.000Z',
      createdAt: '2026-10-20T00:00:00.000Z',
    };
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify(plan), { status: 200, headers: { 'content-type': 'application/json' } })),
    );
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useSharedPlan('plan_AAA'), { wrapper: wrapper(client) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.ownerDisplayName).toBe('Alice AAA');
    expect(result.current.data?.privacyMasked).toBe(true);
  });
});
