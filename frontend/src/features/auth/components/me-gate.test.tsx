import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearSession, setAccessToken } from '../session/session-store.ts';
import { MeGate } from './me-gate.tsx';

function stubMe(status: number) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify({ id: 'u-1', email: 'testing@example.com', displayName: null, roles: ['USER'], emailVerified: true, createdAt: '2026-01-01T00:00:00.000Z' }), { status, headers: { 'content-type': 'application/json' } })),
  );
}

function renderGate() {
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<MeGate><p>Gated Content</p></MeGate>} />
          <Route path="/login" element={<p>Client Login</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('MeGate', () => {
  beforeEach(() => {
    clearSession();
  });

  afterEach(() => {
    clearSession();
    vi.unstubAllGlobals();
  });

  it('shows a spinner while roles resolve, never the content', async () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => {})));
    renderGate();
    expect(await screen.findByText('Loading')).toBeInTheDocument();
    expect(screen.queryByText('Gated Content')).toBeNull();
  });

  it('shows the retry state when the token exists but the lookup fails', async () => {
    setAccessToken('token');
    stubMe(401);
    renderGate();
    expect(await screen.findByText('Session lookup failed')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeVisible();
    expect(screen.queryByText('Client Login')).toBeNull();
    expect(screen.queryByText('Gated Content')).toBeNull();
  });

  it('retries the lookup on Retry', async () => {
    setAccessToken('token');
    stubMe(401);
    renderGate();
    const retry = await screen.findByRole('button', { name: 'Retry' });
    await userEvent.click(retry);
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(screen.getByText('Session lookup failed')).toBeVisible();
  });

  it('sends a signed-out lookup failure to login', async () => {
    stubMe(401);
    renderGate();
    expect(await screen.findByText('Client Login')).toBeVisible();
    expect(screen.queryByText('Session lookup failed')).toBeNull();
  });
});
