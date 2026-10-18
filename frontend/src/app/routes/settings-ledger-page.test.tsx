import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Navigate, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import * as csvExport from '../../lib/csv-export.ts';
import { setLocale } from '../../lib/locale-store.ts';
import { SettingsLedgerPage } from './settings-ledger-page.tsx';

describe('SettingsLedgerPage', () => {
  it('lists sandbox executions with their tiers, passkey proof, and digests', () => {
    setLocale('en');
    render(
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

    render(
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

  it('redirects /evidence to /settings/ledger', () => {
    setLocale('en');
    render(
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
