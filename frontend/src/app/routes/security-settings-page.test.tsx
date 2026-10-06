import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { setLocale } from '../../lib/locale-store.ts';
import { SecuritySettingsPage } from './security-settings-page.tsx';

const me = {
  id: 'user-1',
  email: 'elena@example.eu',
  displayName: 'Elena',
  roles: ['expat'],
  emailVerified: true,
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('SecuritySettingsPage', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('shows the session, the tier ladder, and the passkey empty state', async () => {
    setLocale('en');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify(me), { status: 200, headers: { 'content-type': 'application/json' } })),
    );
    render(
      <QueryClientProvider client={new QueryClient()}>
        <SecuritySettingsPage />
      </QueryClientProvider>,
    );

    expect(await screen.findByText('elena@example.eu')).toBeVisible();
    for (const tier of ['TIER_0_READ', 'TIER_1_ADVISORY', 'TIER_2_SIMULATE', 'TIER_3_EXECUTE']) {
      expect(screen.getByText(tier)).toBeVisible();
    }
    expect(screen.getByText('No passkeys yet — enrollment arrives with the backend passkey module.')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeVisible();
    expect(screen.getByLabelText('Reporting currency')).toBeVisible();
  });

  it('allows configuring global reporting currency', async () => {
    setLocale('en');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify(me), { status: 200, headers: { 'content-type': 'application/json' } })),
    );
    render(
      <QueryClientProvider client={new QueryClient()}>
        <SecuritySettingsPage />
      </QueryClientProvider>,
    );

    const currencySelect = screen.getByLabelText('Reporting currency');
    expect(currencySelect).toBeVisible();

    await userEvent.selectOptions(currencySelect, 'USD');
    expect(currencySelect).toHaveValue('USD');
    expect(screen.getByText(/Active reporting:/)).toBeVisible();
  });

  it('shows confirmation overlay before deleting account, and sends DELETE /api/auth/me on confirm', async () => {
    setLocale('en');
    window.localStorage.setItem('dewa_profile_answers_elena@example.eu', JSON.stringify({ test: true }));
    window.localStorage.setItem('dewa_preferred_currency_elena@example.eu', 'EUR');
    window.sessionStorage.setItem('dewa_profile_draft_elena@example.eu', JSON.stringify({ draft: true }));

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('/api/auth/me') && init?.method === 'DELETE') {
        return new Response(null, { status: 204 });
      }
      return new Response(JSON.stringify(me), { status: 200, headers: { 'content-type': 'application/json' } });
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <QueryClientProvider client={new QueryClient()}>
        <SecuritySettingsPage />
      </QueryClientProvider>,
    );

    const deleteBtn = await screen.findByRole('button', { name: 'Delete account' });
    expect(deleteBtn).toBeVisible();

    // Dialog is initially closed
    expect(screen.queryByRole('dialog', { name: 'Delete your account?' })).toBeNull();

    // Click opens overlay dialog
    await userEvent.click(deleteBtn);
    const dialog = screen.getByRole('dialog', { name: 'Delete your account?' });
    expect(dialog).toBeVisible();
    expect(screen.getByText(/This action cannot be undone/)).toBeVisible();

    // Cancel closes dialog without deleting
    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    await userEvent.click(cancelBtn);
    expect(screen.getByRole('dialog', { hidden: true })).not.toHaveAttribute('open');
    expect(fetchMock).not.toHaveBeenCalledWith(expect.stringContaining('/api/auth/me'), expect.objectContaining({ method: 'DELETE' }));

    // Reopen and confirm
    await userEvent.click(deleteBtn);
    const confirmBtn = screen.getByRole('button', { name: 'Yes, delete account' });
    await userEvent.click(confirmBtn);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/me'),
      expect.objectContaining({ method: 'DELETE' }),
    );

    // Browser storage is wiped
    expect(window.localStorage.getItem('dewa_profile_answers_elena@example.eu')).toBeNull();
    expect(window.localStorage.getItem('dewa_preferred_currency_elena@example.eu')).toBeNull();
    expect(window.sessionStorage.getItem('dewa_profile_draft_elena@example.eu')).toBeNull();
  });
});
