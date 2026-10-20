import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { clearSession, setAccessToken } from '../../features/auth/session/session-store.ts';
import { saveAdminActingSession } from '../../features/auth/session/acting-session.ts';
import { GuestRoute } from '../route-guards.tsx';
import { RootRoute } from './root-route.tsx';

function stubMe(status: number, roles: string[], email = 'user@example.com') {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify({ id: 'u-1', email, displayName: null, roles, emailVerified: true, createdAt: '2026-01-01T00:00:00.000Z' }), { status, headers: { 'content-type': 'application/json' } })),
  );
}

function renderRoot(initialEntry = '/') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <RootRoute />,
        children: [{ index: true, element: <p>Client Den Body</p> }],
      },
      { path: '/advisor', element: <p>Advisor Landing</p> },
      { path: '/admin', element: <p>Admin Landing</p> },
    ],
    { initialEntries: [initialEntry] },
  );
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe('RootRoute role redirect', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    clearSession();
    sessionStorage.clear();
    vi.unstubAllGlobals();
  });

  it('shows the public homepage to anonymous visitors', async () => {
    clearSession();
    stubMe(401, ['USER']);
    renderRoot('/');
    expect(await screen.findByRole('heading', { level: 1, name: /Bridging the gap/i })).toBeVisible();
  });

  it('keeps a pure USER on the client dashboard', async () => {
    setAccessToken('token');
    stubMe(200, ['USER']);
    renderRoot('/');
    expect(await screen.findByText('Client Den Body')).toBeVisible();
  });

  it('redirects a signed-in ADVISOR to the workstation', async () => {
    setAccessToken('token');
    stubMe(200, ['USER', 'ADVISOR'], 'advisor.morgan@syntropy.ch');
    renderRoot('/');
    expect(await screen.findByText('Advisor Landing')).toBeVisible();
    expect(screen.queryByText('Client Den Body')).toBeNull();
  });

  it('redirects a signed-in ADMIN to the console', async () => {
    setAccessToken('token');
    stubMe(200, ['USER', 'ADMIN'], 'admin@example.com');
    renderRoot('/');
    expect(await screen.findByText('Admin Landing')).toBeVisible();
    expect(screen.queryByText('Client Den Body')).toBeNull();
  });

  it('lets an acting admin session reach the client dashboard', async () => {
    setAccessToken('token');
    stubMe(200, ['USER', 'ADMIN'], 'admin@example.com');
    saveAdminActingSession('fake-admin-token', 'admin@example.com', {
      id: 'client-1',
      name: 'Elena Vance',
      email: 'testing@example.com',
      roleBadge: 'Private Client',
      category: 'CLIENT',
    });
    renderRoot('/');
    expect(await screen.findByText('Client Den Body')).toBeVisible();
  });

  it('bounces a signed-in analyst from the client login to the workstation, never the dashboard', async () => {
    setAccessToken('token');
    stubMe(200, ['USER', 'ADVISOR'], 'advisor.morgan@syntropy.ch');
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const router = createMemoryRouter(
      [
        {
          element: <GuestRoute />,
          children: [{ path: '/login', element: <p>Client Login</p> }],
        },
        {
          path: '/',
          element: <RootRoute />,
          children: [{ index: true, element: <p>Client Den Body</p> }],
        },
        { path: '/advisor', element: <p>Advisor Landing</p> },
      ],
      { initialEntries: ['/login'] },
    );
    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );
    expect(await screen.findByText('Advisor Landing')).toBeVisible();
    expect(screen.queryByText('Client Den Body')).toBeNull();
  });
});
