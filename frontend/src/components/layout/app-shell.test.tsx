import { render, screen, waitFor, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppShell } from './app-shell.tsx';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { saveAdminActingSession } from '../../features/auth/session/acting-session.ts';
import { clearSession, setAccessToken } from '../../features/auth/session/session-store.ts';

function stubMe(roles: string[], email = 'testing@example.com') {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify({ id: 'u-1', email, displayName: null, roles, emailVerified: true, createdAt: '2026-01-01T00:00:00.000Z' }), { status: 200, headers: { 'content-type': 'application/json' } })),
  );
}

function actAsClient() {
  saveAdminActingSession('fake-admin-token', 'admin@example.com', {
    id: 'client-1',
    name: 'Elena Vance',
    email: 'testing@example.com',
    roleBadge: 'Private Client',
    category: 'CLIENT',
  });
}

function renderShell(initialEntry = '/') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(
    [
      {
        element: <AppShell />,
        children: [
          { path: '/', element: <p>Client Den Body</p> },
          { path: '/advisor', element: <p>Advisor Body</p> },
          { path: '/advisor/settings', element: <p>Advisor Settings Body</p> },
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
    clearSession();
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

  it('renders advisor workstation navigation in sidebar when at /advisor', async () => {
    stubMe(['USER', 'ADVISOR'], 'advisor.morgan@syntropy.ch');
    renderShell('/advisor');
    expect(await screen.findByText('Advisor Body')).toBeVisible();

    // Advisor workstation side tabs
    expect(screen.getByRole('link', { name: 'Client Overview' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Client Portfolio' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'AI Advisory Copilot' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Instrument Matrix' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Onboarding & Invites' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Evidence & Audit' })).toBeVisible();
    // Analysts must not see an exit back to the client app
    expect(screen.queryByRole('link', { name: 'Exit to Client App' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Exit' })).toBeNull();

    // Settings is in advisor sidebar and points to /advisor/settings
    const advisorNav = screen.getByRole('navigation', { name: 'Advisor workstation navigation' });
    const advisorSettingsLink = within(advisorNav).getByRole('link', { name: 'Settings' });
    expect(advisorSettingsLink).toBeVisible();
    expect(advisorSettingsLink).toHaveAttribute('href', '/advisor/settings');
    expect(within(advisorNav).queryByRole('link', { name: 'Security' })).toBeNull();

    // Settings must NOT be in the top navbar header
    const header = screen.getByRole('banner');
    expect(within(header).queryByRole('link', { name: 'Settings' })).toBeNull();
    expect(within(header).queryByRole('link', { name: 'Security' })).toBeNull();

    // Admin console items are NOT in advisor sidebar
    expect(screen.queryByRole('link', { name: 'User Accounts' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Demo Credentials' })).toBeNull();
  });

  it('renders admin console navigation in sidebar when at /admin', async () => {
    stubMe(['USER', 'ADMIN'], 'admin@example.com');
    renderShell('/admin');
    expect(await screen.findByText('Admin body')).toBeVisible();
    expect(screen.getByText('Admin Console')).toBeVisible();

    // Admin console items are rendered
    expect(screen.getByRole('link', { name: 'User Accounts' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Demo Credentials' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Models & Keys' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Tenants' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'API Keys' })).toBeVisible();

    // Without an acting session `/` bounces admins back, so the exit links stay hidden instead of dead.
    expect(screen.queryByRole('link', { name: 'Exit to Client App' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Exit' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Exit Admin' })).toBeNull();

    // Client-only navigation items are not in the admin sidebar
    expect(screen.queryByRole('link', { name: 'Cash Flow' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Advisory' })).toBeNull();
  });

  it('shows the admin exit links only while an acting session is active', async () => {
    stubMe(['USER', 'ADMIN'], 'admin@example.com');
    actAsClient();
    renderShell('/admin');
    expect(await screen.findByText('Admin body')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Exit to Client App' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Exit' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Exit Admin' })).toBeVisible();
  });

  it('shows the retry state instead of demo chrome when the lookup fails with a token', async () => {
    setAccessToken('token');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{}', { status: 401, headers: { 'content-type': 'application/json' } })),
    );
    renderShell('/');
    expect(await screen.findByText('Session lookup failed')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Dashboard' })).toBeNull();
    expect(screen.queryByText(/Elena/)).toBeNull();
  });

  it('keeps client den chrome on /settings/security for advisors and provides a separate Advisor Workstation link', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ id: 'a-1', email: 'advisor.morgan@syntropy.ch', displayName: 'Alex Morgan', roles: ['USER', 'ADVISOR'], emailVerified: true, createdAt: '2026-01-01T00:00:00.000Z' }), { status: 200, headers: { 'content-type': 'application/json' } })),
    );
    renderShell('/settings/security');
    expect(await screen.findByText('Settings Body')).toBeVisible();

    // Personal client tabs remain visible on /settings/security, plus a separate Advisor Workstation link and top-header button
    await waitFor(() => expect(screen.getByRole('link', { name: 'Advisor Workstation' })).toBeVisible());
    expect(screen.getByRole('link', { name: 'Advisor Workstation' })).toHaveAttribute('href', '/advisor');
    expect(screen.getByRole('link', { name: 'Enter Wealth Analyst Workstation' })).toHaveAttribute('href', '/advisor');
    expect(screen.getAllByRole('link', { name: 'Dashboard' }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole('link', { name: 'Cash Flow' }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole('link', { name: 'Advisory' }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Personal Portfolio: Alex Morgan')).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Client Overview' })).toBeNull();
  });

  it('keeps advisor workstation chrome on /advisor/settings', async () => {
    stubMe(['USER', 'ADVISOR'], 'advisor.morgan@syntropy.ch');
    renderShell('/advisor/settings');
    expect(await screen.findByText('Advisor Settings Body')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Client Overview' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'AI Advisory Copilot' })).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Dashboard' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Exit to Client App' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Exit' })).toBeNull();
  });

  it('renders a neutral loading frame while roles resolve, with no client tabs or demo data', async () => {
    let resolveMe!: (value: Response) => void;
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise<Response>((resolve) => { resolveMe = resolve; })),
    );
    renderShell('/advisor');
    expect(await screen.findByText('Loading')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Dashboard' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Cash Flow' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Advisory' })).toBeNull();
    expect(screen.queryByText(/Elena/)).toBeNull();
    resolveMe(new Response(JSON.stringify({ id: 'a-1', email: 'advisor.morgan@syntropy.ch', displayName: null, roles: ['USER', 'ADVISOR'], emailVerified: true, createdAt: '2026-01-01T00:00:00.000Z' }), { status: 200, headers: { 'content-type': 'application/json' } }));
    expect(await screen.findByText('Advisor Body')).toBeVisible();
  });

  it('displays acting mode banner when an admin is impersonating a demo persona', async () => {
    stubMe(['USER']);
    actAsClient();

    renderShell('/');
    expect(await screen.findByText('Client Den Body')).toBeVisible();
    expect(screen.getByRole('complementary', { name: 'Admin demo session active' })).toBeVisible();
    expect(screen.getByText(/Admin Acting Mode:/)).toBeVisible();
    expect(screen.getByText('Elena Vance')).toBeVisible();
    expect(screen.getByRole('button', { name: /Return to Admin Console/ })).toBeVisible();
  });
});
