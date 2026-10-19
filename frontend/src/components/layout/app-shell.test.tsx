import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';
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

  it('renders client den with no admin overview or advisor links', () => {
    renderShell('/');
    expect(screen.getByText('Client Den Body')).toBeVisible();

    // Client tabs are present
    for (const name of ['Dashboard', 'Cash Flow', 'Advisory']) {
      expect(screen.getAllByRole('link', { name }).length).toBeGreaterThanOrEqual(2);
    }

    // Security & settings are present
    expect(screen.getByRole('link', { name: 'Settings' })).toBeVisible();

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
