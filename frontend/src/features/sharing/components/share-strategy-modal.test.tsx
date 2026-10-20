import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setLocale } from '../../../lib/locale-store.ts';
import { ShareStrategyModal } from './share-strategy-modal.tsx';

function renderModal() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <ShareStrategyModal open={true} onClose={() => {}} ownerDisplayName="Elena Vance" />
    </QueryClientProvider>,
  );
}

describe('ShareStrategyModal', () => {
  beforeEach(() => {
    setLocale('en');
    vi.stubGlobal('va', vi.fn());
  });

  afterEach(() => vi.unstubAllGlobals());

  it('issues a masked share URL and copies it', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({ shareToken: 'dewa_sec_abc', url: '/share/dewa_sec_abc', expiresAt: '2026-10-23T00:00:00.000Z' }),
          { status: 201, headers: { 'content-type': 'application/json' } },
        ),
      ),
    );
    const writeText = vi.fn(async (_text: string) => {});
    Object.defineProperty(window.navigator, 'clipboard', { value: { writeText }, configurable: true });
    renderModal();

    expect(screen.getByRole('checkbox', { name: /Mask absolute amounts/ })).toBeChecked();
    await userEvent.click(screen.getByRole('button', { name: 'Create link' }));

    expect(await screen.findByDisplayValue('http://localhost:3000/share/dewa_sec_abc')).toBeVisible();

    await userEvent.click(screen.getByRole('button', { name: 'Copy' }));
    expect(writeText).toHaveBeenCalledWith('http://localhost:3000/share/dewa_sec_abc');
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeVisible();

    vi.unstubAllGlobals();
    delete (window.navigator as unknown as { clipboard?: unknown }).clipboard;
  });

  it('sends the unmasked choice when the toggle is cleared', async () => {
    const fetchSpy = vi.fn(async () =>
      new Response(
        JSON.stringify({ shareToken: 'dewa_sec_xyz', url: '/share/dewa_sec_xyz', expiresAt: '2026-10-23T00:00:00.000Z' }),
        { status: 201, headers: { 'content-type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchSpy);
    renderModal();

    await userEvent.click(screen.getByRole('checkbox', { name: /Mask absolute amounts/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Create link' }));
    await screen.findByDisplayValue('http://localhost:3000/share/dewa_sec_xyz');

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const calls = fetchSpy.mock.calls[0] as unknown as [string, RequestInit];
    const body = JSON.parse(calls[1].body as string);
    expect(body.privacyMasked).toBe(false);
    vi.unstubAllGlobals();
  });
});
