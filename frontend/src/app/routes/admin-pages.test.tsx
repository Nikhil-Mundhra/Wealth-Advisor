import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { setLocale } from '../../lib/locale-store.ts';
import { AdminApiKeysPage } from './admin-api-keys-page.tsx';
import { AdminModelsPage } from './admin-models-page.tsx';
import { AdminPage } from './admin-page.tsx';
import { AdminTenantsPage } from './admin-tenants-page.tsx';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

function renderAt(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(
    [
      { path: '/admin', element: <AdminPage /> },
      { path: '/admin/tenants', element: <AdminTenantsPage /> },
      { path: '/admin/api-keys', element: <AdminApiKeysPage /> },
      { path: '/admin/models', element: <AdminModelsPage /> },
    ],
    { initialEntries: [path] },
  );
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe('admin pages', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('links every section from the overview', () => {
    setLocale('en');
    renderAt('/admin');

    expect(screen.getByRole('heading', { name: 'Overview' })).toBeVisible();
    for (const name of ['User accounts', 'Tenants', 'API keys', 'Models']) {
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

  it('provisions a new organization on the tenants page', async () => {
    setLocale('en');
    const created = {
      id: 't-new',
      slug: 'meridian-family-office',
      name: 'Meridian Family Office',
      plan: 'INSTITUTIONAL',
      status: 'ACTIVE',
      settings: {
        baselineCurrency: 'AED',
        allowedCorridors: ['EUR_CNY', 'GBP_SGD'],
        defaultLlmProvider: 'mock',
        maxMembers: 50,
        requirePasskeyForRebalance: true,
      },
      createdAt: '2026-04-16T00:00:00.000Z',
      updatedAt: '2026-04-16T00:00:00.000Z',
    };
    const tenants = [
      {
        ...created,
        id: 't-1',
        slug: 'elena-household',
        name: 'Elena Household',
        plan: 'STARTER',
        settings: { ...created.settings, baselineCurrency: 'EUR' },
      },
    ];

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.endsWith('/api/admin/tenants') && init?.method === 'POST') {
        tenants.push(created);
        return jsonResponse(created, 201);
      }
      return jsonResponse({ tenants: [...tenants] });
    });
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    renderAt('/admin/tenants');

    expect(await screen.findByText('Elena Household')).toBeVisible();

    await user.type(screen.getByLabelText('Organization name'), 'Meridian Family Office');
    expect(screen.getByLabelText('Tenant slug')).toHaveValue('meridian-family-office');
    await user.selectOptions(screen.getByLabelText('Subscription plan'), 'INSTITUTIONAL');
    await user.selectOptions(screen.getByLabelText('Baseline currency'), 'AED');
    await user.click(screen.getByRole('button', { name: 'Create tenant' }));

    expect(await screen.findByText(/Provisioned tenant/)).toBeVisible();
    await waitFor(() => {
      expect(within(screen.getByRole('list')).getByText('Meridian Family Office')).toBeVisible();
    });
  });

  it('issues a new API key and reveals the one-time secret banner', async () => {
    setLocale('en');
    const apiKeys = [
      {
        id: 'k-1',
        tenantId: 't-1',
        name: 'Existing Runner',
        keyPrefix: 'wa_live_ab12',
        permissions: ['read:analytics'],
        rateLimitPerMinute: 60,
        monthlyTokenQuota: 100000,
        usedTokensThisMonth: 120,
        status: 'ACTIVE',
        lastUsedAt: null,
        expiresAt: null,
        createdAt: '2026-04-16T00:00:00.000Z',
      },
    ];
    const tenants = [
      {
        id: 't-1',
        slug: 'elena-household',
        name: 'Elena Household',
        plan: 'STARTER',
        status: 'ACTIVE',
        settings: {
          baselineCurrency: 'EUR',
          allowedCorridors: ['EUR_CNY', 'GBP_SGD'],
          defaultLlmProvider: 'mock',
          maxMembers: 50,
          requirePasskeyForRebalance: true,
        },
        createdAt: '2026-04-16T00:00:00.000Z',
        updatedAt: '2026-04-16T00:00:00.000Z',
      },
    ];

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.endsWith('/api/admin/tenants')) {
        return jsonResponse({ tenants });
      }
      if (url.endsWith('/api/admin/api-keys') && init?.method === 'POST') {
        const issued = {
          apiKey: {
            ...apiKeys[0],
            id: 'k-2',
            name: 'Treasury Bot',
            keyPrefix: 'wa_live_zz99',
          },
          secretKey: 'wa_live_zz99_secret_once_only',
        };
        apiKeys.push(issued.apiKey);
        return jsonResponse(issued, 201);
      }
      return jsonResponse({ apiKeys: [...apiKeys] });
    });
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    renderAt('/admin/api-keys');

    expect(await screen.findByText('Existing Runner')).toBeVisible();

    await user.type(screen.getByLabelText('Key label'), 'Treasury Bot');
    await user.click(screen.getByRole('button', { name: 'Issue key' }));

    expect(await screen.findByText('wa_live_zz99_secret_once_only')).toBeVisible();
    await waitFor(() => {
      expect(within(screen.getByRole('list')).getByText('Treasury Bot')).toBeVisible();
    });
  });
});
