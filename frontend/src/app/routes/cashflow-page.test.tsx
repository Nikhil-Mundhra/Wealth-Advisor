import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';
import { setLocale } from '../../lib/locale-store.ts';
import { CashflowPage } from './cashflow-page.tsx';

let client: QueryClient;

function stubMe(status = 200) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify({ id: 'u-1', email: 'testing@example.com', displayName: null, roles: ['USER'], emailVerified: true, createdAt: '2026-01-01T00:00:00.000Z' }), { status, headers: { 'content-type': 'application/json' } })),
  );
}

describe('CashflowPage', () => {
  beforeEach(() => {
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    setLocale('en');
    stubMe();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists multi-currency accounts and the remittance plan', async () => {
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <CashflowPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByRole('heading', { name: 'Cash Flow' })).toBeVisible();
    expect(screen.getByText('EU Current')).toBeVisible();
    expect(screen.getByText('EUR → CNY')).toBeVisible();
    expect(screen.getByText('¥25,000')).toBeVisible();
  });

  it('shows a loading frame without demo fixtures while roles resolve', async () => {
    vi.unstubAllGlobals();
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => {})));
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <CashflowPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText('Loading')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Cash Flow' })).toBeNull();
    expect(screen.queryByText('EU Current')).toBeNull();
  });

  it('sends a failed session to login without demo fixtures', async () => {
    vi.unstubAllGlobals();
    stubMe(401);
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<CashflowPage />} />
            <Route path="/login" element={<p>Client Login</p>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText('Client Login')).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Cash Flow' })).toBeNull();
    expect(screen.queryByText('EU Current')).toBeNull();
  });
});
