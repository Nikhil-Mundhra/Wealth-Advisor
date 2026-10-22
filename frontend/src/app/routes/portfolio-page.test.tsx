import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';
import { setLocale } from '../../lib/locale-store.ts';
import { PortfolioPage } from './portfolio-page.tsx';

let client: QueryClient;

function stubMe(status = 200) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify({ id: 'u-1', email: 'testing@example.com', displayName: null, roles: ['USER'], emailVerified: true, createdAt: '2026-01-01T00:00:00.000Z' }), { status, headers: { 'content-type': 'application/json' } })),
  );
}

describe('PortfolioPage', () => {
  beforeEach(() => {
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    setLocale('en');
    stubMe();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists holdings with current, target, and drift weights', async () => {
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <PortfolioPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByRole('heading', { name: 'Portfolio' })).toBeVisible();
    expect(screen.getByRole('row', { name: /US Tech Equities/ })).toHaveTextContent('60%');
    // 40% target on 60% current: a -20pt drift into cash buffers.
    expect(screen.getByRole('row', { name: /US Tech Equities/ })).toHaveTextContent('-20%');
    // Unheld target classes still render so the book sums.
    expect(screen.getByRole('row', { name: /FX_HEDGE/ })).toHaveTextContent('+10%');
  });

  it('opens the share strategy modal from the portfolio page', async () => {
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <PortfolioPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await userEvent.click(await screen.findByRole('button', { name: 'Share strategy' }));
    expect(screen.getByRole('dialog', { name: 'Share strategy' })).toBeVisible();
    expect(screen.getByRole('checkbox', { name: /Hide holding names and amounts/ })).toBeChecked();
  });

  it('shows a loading frame without demo fixtures while roles resolve', async () => {
    vi.unstubAllGlobals();
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => {})));
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <PortfolioPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText('Loading')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Portfolio' })).toBeNull();
    expect(screen.queryByRole('row', { name: /US Tech Equities/ })).toBeNull();
  });

  it('sends a failed session to login without demo fixtures', async () => {
    vi.unstubAllGlobals();
    stubMe(401);
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/portfolio']}>
          <Routes>
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/login" element={<p>Client Login</p>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText('Client Login')).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Portfolio' })).toBeNull();
  });
});
