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
      vi.fn(async (input: RequestInfo | URL) => {
        const urlStr = String(input);
        if (urlStr.includes('/sharing/links')) {
          return new Response(JSON.stringify({ plans: [] }), { status: 200, headers: { 'content-type': 'application/json' } });
        }
        return new Response(
          JSON.stringify({ shareToken: 'dewa_sec_abc', url: '/share/dewa_sec_abc', expiresAt: '2026-10-23T00:00:00.000Z' }),
          { status: 201, headers: { 'content-type': 'application/json' } },
        );
      }),
    );
    const writeText = vi.fn(async (_text: string) => {});
    Object.defineProperty(window.navigator, 'clipboard', { value: { writeText }, configurable: true });
    renderModal();

    expect(screen.getByRole('checkbox', { name: /Hide holding names and amounts/ })).toBeChecked();
    await userEvent.click(screen.getByRole('button', { name: 'Create link' }));

    expect(await screen.findByDisplayValue('http://localhost:3000/share/dewa_sec_abc')).toBeVisible();

    await userEvent.click(screen.getByRole('button', { name: 'Copy' }));
    expect(writeText).toHaveBeenCalledWith('http://localhost:3000/share/dewa_sec_abc');
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeVisible();

    vi.unstubAllGlobals();
    delete (window.navigator as unknown as { clipboard?: unknown }).clipboard;
  });

  it('sends the unmasked choice when the toggle is cleared', async () => {
    const fetchSpy = vi.fn(async (input: RequestInfo | URL) => {
      const urlStr = String(input);
      if (urlStr.includes('/sharing/links')) {
        return new Response(JSON.stringify({ plans: [] }), { status: 200, headers: { 'content-type': 'application/json' } });
      }
      return new Response(
        JSON.stringify({ shareToken: 'dewa_sec_xyz', url: '/share/dewa_sec_xyz', expiresAt: '2026-10-23T00:00:00.000Z' }),
        { status: 201, headers: { 'content-type': 'application/json' } },
      );
    });
    vi.stubGlobal('fetch', fetchSpy);
    renderModal();

    await userEvent.click(screen.getByRole('checkbox', { name: /Hide holding names and amounts/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Create link' }));
    await screen.findByDisplayValue('http://localhost:3000/share/dewa_sec_xyz');

    const createCall = fetchSpy.mock.calls.find(([input]) => String(input).includes('/sharing/create')) as unknown as [
      string,
      RequestInit,
    ];
    expect(createCall).toBeDefined();
    const body = JSON.parse(createCall[1].body as string);
    expect(body.privacyMasked).toBe(false);
    vi.unstubAllGlobals();
  });

  it('explains that a portfolio is required before sharing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const urlStr = String(input);
        if (urlStr.includes('/sharing/links')) {
          return new Response(JSON.stringify({ plans: [] }), { status: 200, headers: { 'content-type': 'application/json' } });
        }
        return new Response(JSON.stringify({ code: 'WL_1001', message: 'portfolio not found' }), {
          status: 404,
          headers: { 'content-type': 'application/json' },
        });
      }),
    );
    renderModal();

    await userEvent.click(screen.getByRole('button', { name: 'Create link' }));
    expect(await screen.findByText('Create a portfolio before sharing your strategy.')).toBeVisible();
    vi.unstubAllGlobals();
  });

  it('explains that only an owned or assigned plan can be shared', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const urlStr = String(input);
        if (urlStr.includes('/sharing/links')) {
          return new Response(JSON.stringify({ plans: [] }), { status: 200, headers: { 'content-type': 'application/json' } });
        }
        return new Response(JSON.stringify({ code: 'SH_1003', message: 'forbidden' }), {
          status: 403,
          headers: { 'content-type': 'application/json' },
        });
      }),
    );
    renderModal();

    await userEvent.click(screen.getByRole('button', { name: 'Create link' }));
    expect(await screen.findByText('You can only share your own plan or a client assigned to you.')).toBeVisible();
    vi.unstubAllGlobals();
  });

  it('displays active share links and allows revoking', async () => {
    const fetchSpy = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const urlStr = String(input);
      if (init?.method === 'DELETE') {
        return new Response(JSON.stringify({ revoked: true, shareToken: 'dewa_sec_live1' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      if (urlStr.includes('/sharing/links')) {
        return new Response(
          JSON.stringify({
            plans: [
              {
                shareToken: 'dewa_sec_live1',
                ownerDisplayName: 'Elena Vance',
                privacyMasked: true,
                expiresAt: '2026-10-30T00:00:00.000Z',
                createdAt: '2026-10-22T00:00:00.000Z',
                revokedAt: null,
              },
            ],
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        );
      }
      return new Response(JSON.stringify({}), { status: 200 });
    });
    vi.stubGlobal('fetch', fetchSpy);
    renderModal();

    expect(await screen.findByText('/share/dewa_sec_live1')).toBeVisible();
    const revokeBtn = screen.getByRole('button', { name: 'Revoke' });
    await userEvent.click(revokeBtn);

    expect(await screen.findByText('Revoked')).toBeVisible();
    vi.unstubAllGlobals();
  });
});
