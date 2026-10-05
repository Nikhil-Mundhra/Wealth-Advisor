import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
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
  });
});
