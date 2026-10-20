import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as engagement from '../../lib/engagement.ts';
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
    for (const rosterName of ['Elena Vance', 'Marcus Thorne', 'Aisha Al-Mansoor', 'David Kim']) {
      expect(screen.queryByText(rosterName, { exact: false })).toBeNull();
    }
  });
});
