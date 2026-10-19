import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { AdminRoute, AdvisorRoute } from './route-guards.tsx';

function renderAdmin(roles: string[]) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify({ id: 'u', email: 'a@b.c', displayName: null, roles, emailVerified: true, createdAt: '2026-01-01T00:00:00.000Z' }), { status: 200, headers: { 'content-type': 'application/json' } })),
  );
  const router = createMemoryRouter(
    [
      {
        element: <AdminRoute />,
        children: [{ path: '/admin', element: <p>Console</p> }],
      },
      { path: '/admin/login', element: <p>Admin Login</p> },
      { path: '/', element: <p>Home</p> },
    ],
    { initialEntries: ['/admin'] },
  );
  render(
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

function renderAdvisor(roles: string[]) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify({ id: 'u', email: 'adv@b.c', displayName: null, roles, emailVerified: true, createdAt: '2026-01-01T00:00:00.000Z' }), { status: 200, headers: { 'content-type': 'application/json' } })),
  );
  const router = createMemoryRouter(
    [
      {
        element: <AdvisorRoute />,
        children: [{ path: '/advisor', element: <p>Workstation</p> }],
      },
      { path: '/advisor/login', element: <p>Advisor Login</p> },
      { path: '/', element: <p>Home</p> },
    ],
    { initialEntries: ['/advisor'] },
  );
  render(
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe('AdminRoute', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('lets admins through and sends everyone else to admin login', async () => {
    renderAdmin(['USER', 'ADMIN']);
    expect(await screen.findByText('Console')).toBeVisible();
  });

  it('redirects non-admin roles to admin login', async () => {
    renderAdmin(['USER']);
    expect(await screen.findByText('Admin Login')).toBeVisible();
  });
});

describe('AdvisorRoute', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('lets advisors through', async () => {
    renderAdvisor(['USER', 'ADVISOR']);
    expect(await screen.findByText('Workstation')).toBeVisible();
  });

  it('redirects non-advisor clients to advisor login', async () => {
    renderAdvisor(['USER']);
    expect(await screen.findByText('Advisor Login')).toBeVisible();
  });
});

