import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearSession, setAccessToken } from '../../features/auth/session/session-store.ts';
import { setLocale } from '../../lib/locale-store.ts';
import { DashboardPage } from './dashboard-page.tsx';

let client: QueryClient;

function stubMe(status = 200, roles: string[] = ['USER'], email = 'testing@example.com') {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify({ id: 'u-1', email, displayName: null, roles, emailVerified: true, createdAt: '2026-01-01T00:00:00.000Z' }), { status, headers: { 'content-type': 'application/json' } })),
  );
}

function renderDashboard() {
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('DashboardPage', () => {
  beforeEach(() => {
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    setLocale('en');
    stubMe();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    clearSession();
  });

  it('shows net worth, the runway gauge, and switches household mode', async () => {
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeVisible();
    expect(screen.getByText(/95/)).toBeVisible();
    expect(screen.getByText(/3.2 months · Warning/)).toBeVisible();
    expect(screen.getByRole('img', { name: 'Net worth · 6 months' })).toBeVisible();
    expect(screen.getByRole('link', { name: /Proposed rebalance/ })).toBeVisible();

    await userEvent.click(screen.getByRole('button', { name: 'Individual' }));
    expect(screen.getByRole('button', { name: 'Individual' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Family household' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText(/3 months · Individual/)).toBeVisible();

    const profileButton = screen.getByRole('button', { name: 'Edit profile' });
    expect(profileButton).toBeVisible();
    await userEvent.click(profileButton);
    expect(screen.getByRole('dialog')).toBeVisible();
    expect(screen.getByText('Investor profile')).toBeVisible();
  });

  it('switches chart timeframe and displays trajectory insights', async () => {
    renderDashboard();

    // Initial 6M insight
    expect(await screen.findByText(/Insight:/)).toBeVisible();
    expect(screen.getByText(/6-Month Growth:/)).toBeVisible();

    // Switch to 1W
    const oneWeekBtn = screen.getByRole('button', { name: '1W' });
    await userEvent.click(oneWeekBtn);
    expect(oneWeekBtn).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/7-Day Baseline:/)).toBeVisible();

    // Switch to 1M
    const oneMonthBtn = screen.getByRole('button', { name: '1M' });
    await userEvent.click(oneMonthBtn);
    expect(oneMonthBtn).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/1-Month Trajectory:/)).toBeVisible();
  });

  it('shows a loading frame without demo fixtures while roles resolve', async () => {
    vi.unstubAllGlobals();
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => {})));
    renderDashboard();

    expect(await screen.findByText('Loading')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Dashboard' })).toBeNull();
    expect(screen.queryByText(/Elena/)).toBeNull();
  });

  it('sends a failed session to login without demo fixtures', async () => {
    vi.unstubAllGlobals();
    stubMe(401);
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/login" element={<p>Client Login</p>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText('Client Login')).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Dashboard' })).toBeNull();
    expect(screen.queryByText(/Elena/)).toBeNull();
  });

  it('shows the retry state instead of bouncing to login when the token exists', async () => {
    vi.unstubAllGlobals();
    setAccessToken('token');
    stubMe(401);
    renderDashboard();

    expect(await screen.findByText('Session lookup failed')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Dashboard' })).toBeNull();
  });
});
