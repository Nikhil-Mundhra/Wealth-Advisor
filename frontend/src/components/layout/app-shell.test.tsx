import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';
import { AppShell } from './app-shell.tsx';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

function renderShell(initialEntry = '/') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(
    [
      {
        element: <AppShell />,
        children: [
          { path: '/', element: <p>Page body</p> },
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
  it('renders the page with sidebar and bottom-tab navigation to every core tab', () => {
    renderShell('/');
    expect(screen.getByText('Page body')).toBeVisible();
    // Sidebar and bottom tabs both link the three primary tabs.
    for (const name of ['Dashboard', 'Cash Flow', 'Advisory']) {
      expect(screen.getAllByRole('link', { name }).length).toBeGreaterThanOrEqual(2);
    }
    expect(screen.queryByRole('link', { name: 'Portfolio' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Settings' })).toBeVisible();
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
});
