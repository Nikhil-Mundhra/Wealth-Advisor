import { render, screen, waitFor, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppShell } from './app-shell.tsx';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { saveAdminActingSession } from '../../features/auth/session/acting-session.ts';

function renderShell(initialEntry = '/') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(
    [
      {
        element: <AppShell />,
        children: [
          { path: '/', element: <p>Client Den Body</p> },
          { path: '/advisor', element: <p>Advisor Body</p> },
          { path: '/admin', element: <p>Admin body</p> },
          { path: '/settings/security', element: <p>Settings Body</p> },
        ],
      },
    ],
    { initialEntries: [initialEntry] },
  );
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe('AppShell', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders client den with no admin overview or advisor links', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ id: 'u-1', email: 'testing@example.com', displayName: null, roles: ['USER'], emailVerified: true, createdAt: '2026-01-01T00:00:00.000Z' }), { status: 200, headers: { 'content-type': 'application/json' } })),
    );
    renderShell('/');
    expect(await screen.findByText('Client Den Body')).toBeVisible();

    // Client tabs appear once roles resolve
    for (const name of ['Dashboard', 'Cash Flow', 'Advisory']) {
      expect((await screen.findAllByRole('link', { name })).length).toBeGreaterThanOrEqual(2);
    }

    // Settings is present in sidebar and labelled Settings (not Security)
    const settingsLink = screen.getByRole('link', { name: 'Settings' });
    expect(settingsLink).toBeVisible();
    expect(settingsLink).toHaveAttribute('href', '/settings/security');
    expect(screen.queryByRole('link', { name: 'Security' })).toBeNull();

    // Settings must NOT be in the top navbar header
    const header = screen.getByRole('banner');
    expect(within(header).queryByRole('link', { name: 'Settings' })).toBeNull();
    expect(within(header).queryByRole('link', { name: 'Security' })).toBeNull();

    // Admin overview and Advisor workstation MUST NOT be present in Client Den
    expect(screen.queryByRole('link', { name: 'Admin Overview' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Overview' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Advisor Workstation' })).toBeNull();
  });

  it('renders advisor workstation navigation in sidebar when at /advisor', () => {
    renderShell('/advisor');
    expect(screen.getByText('Advisor Body')).toBeVisible();
    expect(screen.getByText('Advisor Workstation')).toBeVisible();

    // Advisor Overview tab
    expect(screen.getByRole('link', { name: 'Client Overview' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Exit to Client App' })).toBeVisible();

    // Settings is in advisor sidebar and labelled Settings
    const advisorNav = screen.getByRole('navigation', { name: 'Advisor workstation navigation' });
    expect(within(advisorNav).getByRole('link', { name: 'Settings' })).toBeVisible();
    expect(within(advisorNav).queryByRole('link', { name: 'Security' })).toBeNull();

    // Settings must NOT be in the top navbar header
    const header = screen.getByRole('banner');
    expect(within(header).queryByRole('link', { name: 'Settings' })).toBeNull();
    expect(within(header).queryByRole('link', { name: 'Security' })).toBeNull();

    // Admin console items are NOT in advisor sidebar
    expect(screen.queryByRole('link', { name: 'User Accounts' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Demo Credentials' })).toBeNull();
  });

  it('renders admin console navigation in sidebar when at /admin', () => {
    renderShell('/admin');
    expect(screen.getByText('Admin body')).toBeVisible();
    expect(screen.getByText('Admin Console')).toBeVisible();

    // Admin console items are rendered
    expect(screen.getByRole('link', { name: 'User Accounts' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Demo Credentials' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Models & Keys' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Tenants' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'API Keys' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Exit to Client App' })).toBeVisible();

    // Client-only navigation items are not in the admin sidebar
    expect(screen.queryByRole('link', { name: 'Cash Flow' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Advisory' })).toBeNull();
  });

  it('keeps advisor chrome on settings pages for advisors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ id: 'a-1', email: 'advisor.morgan@syntropy.ch', displayName: null, roles: ['USER', 'ADVISOR'], emailVerified: true, createdAt: '2026-01-01T00:00:00.000Z' }), { status: 200, headers: { 'content-type': 'application/json' } })),
    );
    renderShell('/settings/security');
    expect(await screen.findByText('Settings Body')).toBeVisible();

    // Advisor workstation nav once roles resolve, not client tabs
    await waitFor(() => expect(screen.getByText('Advisor Workstation')).toBeVisible());
    expect(screen.getByRole('link', { name: 'Client Overview' })).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Dashboard' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Cash Flow' })).toBeNull();
  });

  it('displays acting mode banner when an admin is impersonating a demo persona', () => {
    saveAdminActingSession('fake-admin-token', 'admin@example.com', {
      id: 'client-1',
      name: 'Elena Vance',
      email: 'testing@example.com',
      roleBadge: 'Private Client',
      category: 'CLIENT',
    });

    renderShell('/');
    expect(screen.getByRole('complementary', { name: 'Admin demo session active' })).toBeVisible();
    expect(screen.getByText(/Admin Acting Mode:/)).toBeVisible();
    expect(screen.getByText('Elena Vance')).toBeVisible();
    expect(screen.getByRole('button', { name: /Return to Admin Console/ })).toBeVisible();
  });
});
