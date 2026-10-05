import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { AdminRoute } from './route-guards.tsx';

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

describe('AdminRoute', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('lets admins through and sends everyone else home', async () => {
    renderAdmin(['ADMIN']);
    expect(await screen.findByText('Console')).toBeVisible();
  });

  it('redirects expat roles home', async () => {
    renderAdmin(['expat']);
    expect(await screen.findByText('Home')).toBeVisible();
  });
});
