import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { setLocale } from '../../lib/locale-store.ts';
import { SharedPlanPage } from './shared-plan-page.tsx';

function renderShare(initialEntries = ['/share/plan_abc123']) {
  const router = createMemoryRouter([{ path: '/share/:token', element: <SharedPlanPage /> }], { initialEntries });
  render(<RouterProvider router={router} />);
  return router;
}

function planResponse(owner: string, token: string) {
  return {
    shareToken: token,
    ownerDisplayName: owner,
    privacyMasked: true,
    planSnapshot: {
      recommendedWeights: { 'US Tech': 0.6, Cash: 0.4 },
      currentWeights: { 'US Tech': 0.6, Cash: 0.4 },
      threePillarRationale: { personalFinance: 'p', crossBorder: 'c', wealthStrategy: 'w' },
      stressTestScenario: { fxShockPercent: 5, estimatedDrawdownPercent: 3.2 },
    },
    expiresAt: '2026-10-27T00:00:00.000Z',
    createdAt: '2026-10-20T00:00:00.000Z',
  };
}

function stubSharingFetch() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: unknown) => {
      if (String(input).endsWith('/api/sharing/plan_AAA')) {
        return new Response(JSON.stringify(planResponse('Alice AAA', 'plan_AAA')), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ code: 'SH_1001' }), {
        status: 404,
        headers: { 'content-type': 'application/json' },
      });
    }),
  );
}

describe('SharedPlanPage', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('masks absolute amounts until the viewer opts in', async () => {
    setLocale('en');
    renderShare();

    expect(screen.getByText('/share/plan_abc123')).toBeVisible();
    expect(screen.queryByText('€57,000')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Show amounts' }));
    expect(screen.getByText('€57,000')).toBeVisible();
  });

  it('shows the stress simulation when the live plan is unavailable', async () => {
    setLocale('en');
    renderShare();

    expect(await screen.findByText('Live plan unavailable. Showing the demo allocation baseline.')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Stress Simulation' })).toBeVisible();
    expect(screen.getByText(/Deterministic illustration/)).toBeVisible();
  });

  it('shows the generic stress heading with the live scenario label and no mask toggle', async () => {
    setLocale('en');
    stubSharingFetch();
    renderShare(['/share/plan_AAA']);

    expect(await screen.findByRole('heading', { name: 'Stress Simulation' })).toBeVisible();
    expect(await screen.findByText('Live scenario · −5% EUR shock')).toBeVisible();
    expect(screen.getByText('FX Shock')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Show amounts' })).not.toBeInTheDocument();
  });

  it('drops the previous token plan when navigating to another token', async () => {
    setLocale('en');
    stubSharingFetch();
    const router = renderShare(['/share/plan_AAA']);

    expect(await screen.findByText('Strategy Shared by Alice AAA')).toBeVisible();

    await act(async () => {
      await router.navigate('/share/plan_BBB');
    });

    // The previous token's plan must not flash through or stick around on fetch failure.
    expect(screen.queryByText('Strategy Shared by Alice AAA')).not.toBeInTheDocument();
    expect(await screen.findByText('Live plan unavailable. Showing the demo allocation baseline.')).toBeVisible();
  });
});
