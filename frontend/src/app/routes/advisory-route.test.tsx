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
              { path: '/onboarding', element: <p>Onboarding</p> },
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

    // Sidebar stays on client tabs; no advisor chrome leaks onto /advisory.
    for (const name of ['Dashboard', 'Cash Flow', 'Advisory']) {
      expect(await screen.findAllByRole('link', { name })).not.toHaveLength(0);
    }
    expect(screen.queryByRole('link', { name: 'Client Overview' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Advisor Workstation' })).toBeNull();
    expect(screen.queryByText('Advisor Workstation')).toBeNull();
    expect(screen.queryByRole('link', { name: 'Exit to Client App' })).toBeNull();
  });

  it('renders the personal portfolio copilot for ADVISOR roles in the client app', async () => {
    renderAdvisoryRoute(['USER', 'ADVISOR'], 'advisor.morgan@syntropy.ch');
    expect(await screen.findByRole('textbox', { name: 'Ask about your portfolio…' })).toBeVisible();
    expect(screen.queryByText('Workstation')).toBeNull();
  });

  it('shows no advisor chrome while roles are unresolved', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise<Response>(() => {})),
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
              children: [{ path: '/advisory', element: <AdvisoryPage /> }],
            },
          ],
        },
      ],
      { initialEntries: ['/advisory'] },
    );
    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );

    // While roles resolve, a neutral loading frame replaces all chrome: no client tabs, no advisor links, no demo data.
    expect(await screen.findByText('Loading')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Advisory' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Client Overview' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Advisor Workstation' })).toBeNull();
    expect(screen.queryByText('Advisor Workstation')).toBeNull();
    expect(screen.queryByRole('link', { name: 'Exit to Client App' })).toBeNull();
  });

  it('renders the personal portfolio copilot for ADMIN roles in the client app', async () => {
    renderAdvisoryRoute(['ADMIN'], 'shenzhen@fintechathon.com');
    expect(await screen.findByRole('textbox', { name: 'Ask about your portfolio…' })).toBeVisible();
    expect(screen.queryByText('Workstation')).toBeNull();
  });
});
