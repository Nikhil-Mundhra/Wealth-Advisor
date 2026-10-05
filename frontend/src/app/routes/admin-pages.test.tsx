import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';
import { setLocale } from '../../lib/locale-store.ts';
import { AdminApiKeysPage } from './admin-api-keys-page.tsx';
import { AdminModelsPage } from './admin-models-page.tsx';
import { AdminPage } from './admin-page.tsx';
import { AdminTenantsPage } from './admin-tenants-page.tsx';

function renderAt(path: string) {
  const router = createMemoryRouter(
    [
      { path: '/admin', element: <AdminPage /> },
      { path: '/admin/tenants', element: <AdminTenantsPage /> },
      { path: '/admin/api-keys', element: <AdminApiKeysPage /> },
      { path: '/admin/models', element: <AdminModelsPage /> },
    ],
    { initialEntries: [path] },
  );
  render(<RouterProvider router={router} />);
}

describe('admin pages', () => {
  it('links every section from the overview', () => {
    setLocale('en');
    renderAt('/admin');

    expect(screen.getByRole('heading', { name: 'Overview' })).toBeVisible();
    for (const name of ['Tenants', 'API keys', 'Models']) {
      expect(screen.getByRole('link', { name })).toBeVisible();
    }
  });

  it('lists every switchable provider with the mock active', () => {
    setLocale('en');
    renderAt('/admin/models');

    for (const name of ['gemini', 'claude', 'openai', 'mock']) {
      expect(screen.getByText(name)).toBeVisible();
    }
    expect(screen.getByText('Active')).toBeVisible();
  });
});
