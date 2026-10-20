import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as engagement from '../../lib/engagement.ts';
import * as apiClient from '../../lib/api-client.ts';
import { setLocale } from '../../lib/locale-store.ts';
import { AdvisoryPage } from './advisory-page.tsx';

function stubMe(roles: string[] = ['USER'], email = 'testing@example.com') {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify({ id: 'u-1', email, displayName: null, roles, emailVerified: true, createdAt: '2026-01-01T00:00:00.000Z' }), { status: 200, headers: { 'content-type': 'application/json' } })),
  );
}

function renderAdvisory() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <AdvisoryPage />
    </QueryClientProvider>,
  );
}

describe('AdvisoryPage', () => {
  beforeEach(() => {
    setLocale('en');
    vi.stubGlobal('va', vi.fn());
    stubMe();
  });

  afterEach(() => vi.unstubAllGlobals());

  it('threads messages, opens the step-up gate, and degrades without platform auth', async () => {
    const trackSpy = vi.spyOn(engagement, 'track');
    renderAdvisory();

    expect(await screen.findByRole('heading', { name: 'Advisory' })).toBeVisible();
    await userEvent.type(screen.getByRole('textbox', { name: 'Ask about your portfolio…' }), 'What about tuition?');
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(screen.getByText('What about tuition?')).toBeVisible();
    expect(trackSpy).toHaveBeenCalledWith(engagement.ENGAGEMENT_EVENTS.copilotMessageSent, {
      hasPresetPrompt: false,
      locale: 'en',
    });

    await userEvent.click(screen.getByRole('button', { name: 'Approve & simulate' }));
    expect(trackSpy).toHaveBeenCalledWith(engagement.ENGAGEMENT_EVENTS.rebalanceProposalApproved, {
      tier: 'TIER_3_EXECUTE',
      isPasskeyGated: true,
    });
    expect(screen.getByRole('dialog', { name: 'Biometric approval' })).toBeVisible();

    // jsdom has no WebAuthn: the gate must say so instead of failing silently.
    await userEvent.click(screen.getByRole('button', { name: 'Sign & execute' }));
    expect(trackSpy).toHaveBeenCalledWith(engagement.ENGAGEMENT_EVENTS.passkeyStepupCompleted, {
      success: true,
      flow: 'REBALANCE',
    });
    expect(screen.getByText('Execution needs the backend passkey module (Phase 2.1).')).toBeVisible();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    trackSpy.mockRestore();
  });

  it('runs stress simulation and tracks event', async () => {
    const trackSpy = vi.spyOn(engagement, 'track');
    renderAdvisory();

    const stressBtn = await screen.findByRole('button', { name: /Simulate −5% EUR shock/ });
    await userEvent.click(stressBtn);

    expect(screen.getByText(/Stress test complete:/)).toBeVisible();
    expect(trackSpy).toHaveBeenCalledWith(engagement.ENGAGEMENT_EVENTS.stressSimulationRun, {
      scenario: 'EUR_SHOCK_5',
      hasCustomShock: false,
    });
    trackSpy.mockRestore();
  });

  it('creates share link and tracks event', async () => {
    const trackSpy = vi.spyOn(engagement, 'track');
    renderAdvisory();

    const shareBtn = await screen.findByRole('button', { name: /Share strategy/ });
    await userEvent.click(shareBtn);

    expect(trackSpy).toHaveBeenCalledWith(engagement.ENGAGEMENT_EVENTS.shareLinkCreated, {
      isMasked: true,
      hasExpiry: true,
    });
    trackSpy.mockRestore();
  });

  it('renders the signed-in client portfolio, never the advisor roster', async () => {
    renderAdvisory();
    const matches = await screen.findAllByText('Private Client');
    expect(matches.length).toBeGreaterThan(0);
    for (const rosterName of ['Elena Vance', 'Marcus Vance', 'Mei-Ling Chen', 'Rahul Sharma']) {
      expect(screen.queryByText(rosterName, { exact: false })).toBeNull();
    }
  });

  it('renders the PROPOSAL card from the action card holdings, not hardcoded sleeves', async () => {
    const realApiRequest = apiClient.apiRequest;
    const requestSpy = vi.spyOn(apiClient, 'apiRequest').mockImplementation(((path: string, options?: object) => {
      if (path === '/advisory/chat') {
        return Promise.resolve({
          reply: 'Rebalanced into the optimizer mix.',
          threePillarRationale: { personalFinance: 'p', crossBorder: 'c', wealthStrategy: 'w' },
          actionCards: [
            {
              cardType: 'PROPOSAL',
              payload: {
                holdings: [
                  { symbol: 'VWCE.DE', name: 'Vanguard FTSE All-World', securityType: 'MUTUAL_FUND_ETF', assetClass: 'EQUITY_GLOBAL', weight: 0.4 },
                  { symbol: 'INFY.NSE', name: 'Infosys', securityType: 'STOCK', assetClass: 'EQUITY_INDIA', weight: 0.6 },
                ],
                currentWeights: { 'VWCE.DE': 0.6, 'INFY.NSE': 0.4 },
                targetWeights: { 'VWCE.DE': 0.4, 'INFY.NSE': 0.6 },
                valuationTotalBase: 9500000,
              },
            },
          ],
          complianceDisclaimer: 'd',
        });
      }
      return (realApiRequest as (path: string, options?: object) => Promise<unknown>)(path, options);
    }) as typeof apiClient.apiRequest);
    renderAdvisory();
    await userEvent.type(await screen.findByRole('textbox', { name: 'Ask about your portfolio…' }), 'Rebalance?');
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(await screen.findByText(/VWCE.DE · MUTUAL_FUND_ETF/)).toBeVisible();
    expect(screen.getByText(/INFY.NSE · STOCK/)).toBeVisible();
    requestSpy.mockRestore();
  });

  it('shows the optimizer failure notice instead of silent empty holdings', async () => {
    const realApiRequest = apiClient.apiRequest;
    const requestSpy = vi.spyOn(apiClient, 'apiRequest').mockImplementation(((path: string, options?: object) => {
      if (path === '/advisory/chat') {
        return Promise.resolve({
          reply: 'The optimizer is unavailable.',
          threePillarRationale: { personalFinance: 'p', crossBorder: 'c', wealthStrategy: 'w' },
          actionCards: [
            {
              cardType: 'NOTICE',
              payload: { code: 'PROPOSAL_UNAVAILABLE', message: 'The optimizer could not build a proposal for this portfolio.' },
            },
          ],
          complianceDisclaimer: 'd',
        });
      }
      return (realApiRequest as (path: string, options?: object) => Promise<unknown>)(path, options);
    }) as typeof apiClient.apiRequest);
    renderAdvisory();
    await userEvent.type(await screen.findByRole('textbox', { name: 'Ask about your portfolio…' }), 'Rebalance?');
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(await screen.findByText('The optimizer could not build a proposal for this portfolio.')).toBeVisible();
    requestSpy.mockRestore();
  });
});
