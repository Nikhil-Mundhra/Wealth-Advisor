import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useAdvisoryChat } from './use-advisory-chat.ts';

function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('useAdvisoryChat', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('posts one turn to /advisory/chat and returns the gateway reply', async () => {
    const reply = {
      reply: 'Rebalanced into the optimizer mix.',
      threePillarRationale: { personalFinance: 'p', crossBorder: 'c', wealthStrategy: 'w' },
      actionCards: [],
      complianceDisclaimer: 'd',
    };
    const seen: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: unknown) => {
        seen.push(String(input));
        return new Response(JSON.stringify(reply), { status: 200, headers: { 'content-type': 'application/json' } });
      }),
    );
    const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const { result } = renderHook(() => useAdvisoryChat(), { wrapper: wrapper(client) });

    result.current.mutate({ message: 'Rebalance?', locale: 'en', householdMode: 'INDIVIDUAL' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(reply);
    expect(seen.some((url) => url.endsWith('/api/advisory/chat'))).toBe(true);
  });
});
