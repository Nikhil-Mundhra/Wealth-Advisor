import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { setLocale } from '../../lib/locale-store.ts';
import { SharedPlanPage } from './shared-plan-page.tsx';

function renderShare(initialEntries = ['/share/plan_AAA']) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter([{ path: '/share/:token', element: <SharedPlanPage /> }], { initialEntries });
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return router;
}

function planResponse({
  owner = 'Alice AAA',
  token = 'plan_AAA',
  stress = { fxShockPercent: 5, estimatedDrawdownPercent: 3.2 },
}: {
  owner?: string;
  token?: string;
  stress?: { fxShockPercent: number; estimatedDrawdownPercent: number } | null;
} = {}) {
  return {
    shareToken: token,
    ownerDisplayName: owner,
    privacyMasked: true,
    planSnapshot: {
      recommendedWeights: { 'US Tech': 0.6, Cash: 0.4 },
      currentWeights: { 'US Tech': 0.6, Cash: 0.4 },
      threePillarRationale: { personalFinance: 'p', crossBorder: 'c', wealthStrategy: 'w' },
      stressTestScenario: stress,
    },
    expiresAt: '2026-10-27T00:00:00.000Z',
    createdAt: '2026-10-20T00:00:00.000Z',
  };
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

function stubSharingFetch(respond: (token: string) => Response) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: unknown) => {
      const token = String(input).split('/').pop() ?? '';
      return respond(token);
    }),
  );
}

describe('SharedPlanPage', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('renders the live plan without the demo baseline or an amount toggle', async () => {
    setLocale('en');
    stubSharingFetch(() => jsonResponse(planResponse()));
    renderShare();

    expect(await screen.findByText('Strategy shared by Alice AAA')).toBeVisible();
    expect(screen.getByText(/60% Target/)).toBeVisible();
    expect(screen.queryByText('€57,000')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show amounts' })).not.toBeInTheDocument();
  });

  it('shows an expired link as expired instead of falling back to demo holdings', async () => {
    setLocale('en');
    stubSharingFetch(() => jsonResponse({ code: 'SH_1002', message: 'expired' }, 410));
    renderShare();

    expect(await screen.findByText('This share link has expired. Ask the owner to create a new one.', undefined, { timeout: 5000 })).toBeVisible();
    expect(screen.queryByText(/Strategy shared by/)).not.toBeInTheDocument();
    expect(screen.queryByText('€57,000')).not.toBeInTheDocument();
  });

  it('shows an unknown token as invalid', async () => {
    setLocale('en');
    stubSharingFetch(() => jsonResponse({ code: 'SH_1001', message: 'not found' }, 404));
    renderShare(['/share/does-not-exist']);

    expect(await screen.findByText('This share link is invalid or has been removed.', undefined, { timeout: 5000 })).toBeVisible();
  });

  it('shows a rate-limited message when 429 SH_1004 is received', async () => {
    setLocale('en');
    stubSharingFetch(() => jsonResponse({ code: 'SH_1004', message: 'too many requests' }, 429));
    renderShare();

    expect(await screen.findByText('Too many requests. Please wait a minute and try again.', undefined, { timeout: 5000 })).toBeVisible();
    expect(screen.queryByText(/Strategy shared by/)).not.toBeInTheDocument();
  });

  it('shows a load failure without inventing a plan', async () => {
    setLocale('en');
    stubSharingFetch(() => jsonResponse({ code: 'CORE_INTERNAL', message: 'boom' }, 500));
    renderShare();

    expect(await screen.findByText('The shared plan could not be loaded. Please try again.', undefined, { timeout: 5000 })).toBeVisible();
    expect(screen.queryByText(/Strategy shared by/)).not.toBeInTheDocument();
  });

  it('does not invent a stress scenario when the snapshot carries none', async () => {
    setLocale('en');
    stubSharingFetch(() => jsonResponse(planResponse({ stress: null })));
    renderShare();

    expect(await screen.findByText('No stress scenario is attached to this plan.')).toBeVisible();
    expect(screen.queryByText('FX Shock')).not.toBeInTheDocument();
  });

  it('drops the previous token plan when navigating to another token', async () => {
    setLocale('en');
    stubSharingFetch((token) =>
      token === 'plan_AAA'
        ? jsonResponse(planResponse())
        : jsonResponse({ code: 'SH_1001', message: 'not found' }, 404),
    );
    const router = renderShare(['/share/plan_AAA']);

    expect(await screen.findByText('Strategy shared by Alice AAA')).toBeVisible();

    await act(async () => {
      await router.navigate('/share/plan_BBB');
    });

    // The previous token's plan must not flash through or stick around on fetch failure.
    expect(screen.queryByText('Strategy shared by Alice AAA')).not.toBeInTheDocument();
    expect(await screen.findByText('This share link is invalid or has been removed.', undefined, { timeout: 5000 })).toBeVisible();
  });
});
