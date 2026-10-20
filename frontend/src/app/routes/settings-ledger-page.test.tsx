import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Navigate, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import * as csvExport from '../../lib/csv-export.ts';
import * as jsonExport from '../../lib/json-export.ts';
import { setLocale } from '../../lib/locale-store.ts';
import { SettingsLedgerPage } from './settings-ledger-page.tsx';

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('SettingsLedgerPage', () => {
  it('lists sandbox executions with their tiers, passkey proof, and digests', () => {
    setLocale('en');
    renderWithClient(
      <MemoryRouter>
        <SettingsLedgerPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Sandbox ledger' })).toBeVisible();
    expect(screen.getByRole('row', { name: /Rebalance 20%/ })).toHaveTextContent('TIER_3_EXECUTE');
    expect(screen.getByRole('row', { name: /Rebalance 20%/ })).toHaveTextContent('Verified');
    expect(screen.getByRole('row', { name: /Simulate −5%/ })).toHaveTextContent('None');
    expect(screen.getByText('9f2c41ab…e7')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Export CSV' })).toBeVisible();
  });

  it('triggers CSV download on button click', async () => {
    setLocale('en');
    const downloadSpy = vi.spyOn(csvExport, 'downloadCsv').mockImplementation(() => {});

    renderWithClient(
      <MemoryRouter>
        <SettingsLedgerPage />
      </MemoryRouter>,
    );

    const exportBtn = screen.getByRole('button', { name: 'Export CSV' });
    await userEvent.click(exportBtn);

    expect(downloadSpy).toHaveBeenCalledTimes(1);
    expect(downloadSpy).toHaveBeenCalledWith(
      'tax-sandbox-ledger-2026-09.csv',
      expect.stringContaining('Tax and Sandbox Execution Ledger'),
    );
    downloadSpy.mockRestore();
  });

  it('triggers JSON download on button click', async () => {
    setLocale('en');
    const downloadSpy = vi.spyOn(jsonExport, 'downloadJson').mockImplementation(() => {});

    renderWithClient(
      <MemoryRouter>
        <SettingsLedgerPage />
      </MemoryRouter>,
    );

    const exportBtn = screen.getByRole('button', { name: 'Export JSON' });
    await userEvent.click(exportBtn);

    expect(downloadSpy).toHaveBeenCalledTimes(1);
    expect(downloadSpy).toHaveBeenCalledWith(
      'tax-sandbox-ledger-2026-09.json',
      expect.stringContaining('Tax and Sandbox Execution Ledger'),
    );
    downloadSpy.mockRestore();
  });

  it('exports raw ISO timestamps, raw trades, and a live source marker from the API ledger', async () => {
    setLocale('en');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            entries: [
              {
                id: 'le_1',
                tenantId: 't1',
                userId: 'u1',
                orderType: 'PORTFOLIO_REBALANCE',
                initialPortfolioStateHash: 'aaa',
                executedTrades: [{ assetSymbol: 'VTI', action: 'BUY', amountBase: 1000, targetWeight: 0.4 }],
                resultingPortfolioStateHash: 'bbb',
                passkeyAssertionProof: {
                  credentialId: 'c',
                  clientDataJson: 'cd',
                  authenticatorData: 'ad',
                  signature: 'sig',
                  verifiedAt: '2026-09-30T18:42:00.000Z',
                },
                auditDigest: 'fulldigest1234567890abcdef',
                transactionHash: 'tx1',
                status: 'COMMITTED',
                timestamp: '2026-09-30T18:42:00.000Z',
              },
            ],
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      ),
    );
    const downloadSpy = vi.spyOn(jsonExport, 'downloadJson').mockImplementation(() => {});

    renderWithClient(
      <MemoryRouter>
        <SettingsLedgerPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/Live API Logs/)).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Export JSON' }));

    expect(downloadSpy).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(downloadSpy.mock.calls[0][1] as string);
    expect(payload.source).toBe('live-api');
    expect(payload.entries).toHaveLength(1);
    expect(payload.entries[0].timestamp).toBe('2026-09-30T18:42:00.000Z');
    expect(payload.entries[0].auditDigest).toBe('fulldigest1234567890abcdef');
    expect(payload.entries[0].executedTrades).toEqual([
      { assetSymbol: 'VTI', action: 'BUY', amountBase: 1000, targetWeight: 0.4 },
    ]);

    downloadSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  it('redirects /evidence to /settings/ledger', () => {
    setLocale('en');
    renderWithClient(
      <MemoryRouter initialEntries={['/evidence']}>
        <Routes>
          <Route path="/evidence" element={<Navigate to="/settings/ledger" replace />} />
          <Route path="/settings/ledger" element={<SettingsLedgerPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Sandbox ledger' })).toBeVisible();
  });
});
