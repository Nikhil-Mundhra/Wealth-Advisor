import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { clearSession, setAccessToken } from '../../features/auth/session/session-store.ts';
import { setLocale } from '../../lib/locale-store.ts';
import { AdvisorRoute, ProtectedRoute } from '../route-guards.tsx';
import { AdvisoryPage } from './advisory-page.tsx';
import { AppShell } from '../../components/layout/app-shell.tsx';

// Router-level test on the real route table: /advisory serves the client copilot,
// while advisor roles bounce to the workstation.
function renderAdvisoryRoute(roles: string[], email: string) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify({ id: 'u-1', email, displayName: null, roles, emailVerified: true, createdAt: '2026-01-01T00:00:00.000Z' }), { status: 200, headers: { 'content-type': 'application/json' } })),
  );
  setAccessToken('test-token');
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(
    [
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <AppShell />,
            children: [
              { path: '/advisory', element: <AdvisoryPage /> },
              {
                element: <AdvisorRoute />,
                children: [{ path: '/advisor', element: <p>Workstation</p> }],
              },
            ],
          },
        ],
      },
      { path: '/advisor/login', element: <p>Advisor Login</p> },
    ],
    { initialEntries: ['/advisory'] },
  );
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe('Advisory route', () => {
  beforeEach(() => {
    setLocale('en');
    vi.stubGlobal('va', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    clearSession();
  });

  it('renders the client copilot for USER roles', async () => {
    renderAdvisoryRoute(['USER'], 'testing@example.com');
    expect(await screen.findByRole('textbox', { name: 'Ask about your portfolio…' })).toBeVisible();
    expect(screen.queryByText('Workstation')).toBeNull();
  });

  it('redirects ADVISOR roles to the workstation', async () => {
    renderAdvisoryRoute(['USER', 'ADVISOR'], 'advisor@example.com');
    expect(await screen.findByText('Workstation')).toBeVisible();
    expect(screen.queryByRole('textbox', { name: 'Ask about your portfolio…' })).toBeNull();
  });
});
