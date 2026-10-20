import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setAdvisorScope } from '../../features/advisor/advisor-store.ts';
import { AdvisorWorkstationPage } from './advisor-workstation-page.tsx';

function renderWorkstation(initialEntry = '/advisor', email = 'advisor.morgan@syntropy.ch', roles = ['USER', 'ADVISOR']) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('/api/auth/advisor/clients')) {
        return new Response(JSON.stringify({ clients: [] }), { status: 200, headers: { 'content-type': 'application/json' } });
      }
      if (url.includes('/api/auth/advisor/invites')) {
        return new Response(JSON.stringify({ invites: [] }), { status: 200, headers: { 'content-type': 'application/json' } });
      }
      return new Response(
        JSON.stringify({
          id: 'adv-1',
          email,
          displayName: 'Alex Morgan',
          roles,
          emailVerified: true,
          createdAt: '2026-01-01T00:00:00.000Z',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }),
  );

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(
    [
      { path: '/advisor', element: <AdvisorWorkstationPage /> },
      { path: '/advisor/client', element: <AdvisorWorkstationPage /> },
      { path: '/advisor/copilot', element: <AdvisorWorkstationPage /> },
      { path: '/advisor/instruments', element: <AdvisorWorkstationPage /> },
      { path: '/advisor/invites', element: <AdvisorWorkstationPage /> },
    ],
    { initialEntries: [initialEntry] },
  );

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe('AdvisorWorkstationPage', () => {
  beforeEach(() => {
    setAdvisorScope(null, false);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    setAdvisorScope(null, false);
  });

  it('scopes the client roster to Alex Morgan (2 assigned clients) instead of all 4', async () => {
    renderWorkstation('/advisor', 'advisor.morgan@syntropy.ch', ['USER', 'ADVISOR']);

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /All Clients Overview \(2\)/ })).toBeVisible();
    });
    expect(screen.getByText('Managing 2 active cross-border client accounts across Europe & Asia corridors.')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Elena Vance' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Marcus Vance' })).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Mei-Ling Chen' })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Rahul Sharma' })).toBeNull();
  });

  it('opens a client portfolio view in one click via Open Portfolio', async () => {
    renderWorkstation('/advisor', 'advisor.morgan@syntropy.ch', ['USER', 'ADVISOR']);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Marcus Vance' })).toBeVisible();
    });

    const openButtons = screen.getAllByRole('button', { name: /Open Portfolio/ });
    await userEvent.click(openButtons[1]!);

    expect(await screen.findByText('Portfolio Holdings Allocation')).toBeVisible();
    expect(screen.getByRole('tab', { name: /Active Client: Marcus Vance/ })).toHaveAttribute('aria-selected', 'true');
  });

  it('renders the inline Institutional Instrument Matrix at /advisor/instruments', async () => {
    renderWorkstation('/advisor/instruments');

    expect(await screen.findByText('Institutional UCITS & Sovereign Instrument Matrix')).toBeVisible();
    expect(screen.getByText('Vanguard FTSE All-World UCITS ETF (USD) Accumulating')).toBeVisible();
  });
});
