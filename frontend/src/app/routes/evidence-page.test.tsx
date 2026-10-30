import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import * as csvExport from '../../lib/csv-export.ts';
import { EvidencePage } from './evidence-page.tsx';

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

function ledgerEntry() {
  return {
    id: 'le_live_1',
    tenantId: 't1',
    userId: 'u1',
    orderType: 'PORTFOLIO_REBALANCE',
    initialPortfolioStateHash: 'aaa',
    executedTrades: [{ assetSymbol: 'VTI', action: 'BUY', amountBase: 100000, targetWeight: 0.4 }],
    resultingPortfolioStateHash: 'bbb',
    passkeyAssertionProof: {
      credentialId: 'c',
      clientDataJson: 'cd',
      authenticatorData: 'ad',
      signature: 'sig',
      verifiedAt: '2026-09-30T18:42:00.000Z',
    },
    auditDigest: 'fulldigest1234567890abcdef',
    transactionHash: '0xtxhash1234567890',
    status: 'COMMITTED',
    timestamp: '2026-09-30T18:42:00.000Z',
  };
}

function stubLedger(entries: unknown[]) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify({ entries }), { status: 200, headers: { 'content-type': 'application/json' } })),
  );
}

describe('EvidencePage', () => {
  it('renders evidence explorer with trust cards and ledger table', async () => {
    stubLedger([ledgerEntry()]);
    renderWithClient(
      <MemoryRouter>
        <EvidencePage />
      </MemoryRouter>
    );

    expect(screen.getByText('Institutional Evidence Explorer')).toBeInTheDocument();
    expect(screen.getByText('Audit Record Integrity')).toBeInTheDocument();
    expect(screen.getByText('FIDO2 WebAuthn')).toBeInTheDocument();
    expect(screen.getByText('SHA-256')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Export CSV/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Download Audit JSON/i })).toBeInTheDocument();
    expect(await screen.findByText('1')).toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it('retains the settings tab bar', () => {
    stubLedger([]);
    renderWithClient(
      <MemoryRouter>
        <EvidencePage />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: 'Security' })).toHaveAttribute('href', '/settings/security');
    expect(screen.getByRole('link', { name: 'Sandbox ledger' })).toHaveAttribute('href', '/settings/ledger');
    expect(screen.getByRole('link', { name: 'Evidence Explorer' })).toHaveAttribute('href', '/evidence');
    expect(screen.getByRole('link', { name: 'AI & Models' })).toHaveAttribute('href', '/settings/ai');
    vi.unstubAllGlobals();
  });

  it('reads ledger rows only from the API, never seeded entries', async () => {
    stubLedger([]);
    renderWithClient(
      <MemoryRouter>
        <EvidencePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('0')).toBeInTheDocument();
    });
    expect(screen.queryByText(/Rebalance 20%/)).not.toBeInTheDocument();
    expect(screen.queryByText('9f2c41ab…e7')).not.toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it('opens in-browser cryptographic verifier when clicking verify math', async () => {
    stubLedger([ledgerEntry()]);
    renderWithClient(
      <MemoryRouter>
        <EvidencePage />
      </MemoryRouter>
    );

    const verifyBtns = await screen.findAllByRole('button', { name: /Verify Math/i });
    expect(verifyBtns.length).toBeGreaterThan(0);

    fireEvent.click(verifyBtns[0]);

    await waitFor(() => {
      expect(screen.getByText('In-Browser Cryptographic Verifier')).toBeInTheDocument();
    });

    expect(screen.getByText(/AuditDigest = SHA256/i)).toBeInTheDocument();
    expect(screen.getByText('Cryptographic Hash Comparison')).toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it('triggers CSV export when Export CSV is clicked', async () => {
    stubLedger([ledgerEntry()]);
    const downloadSpy = vi.spyOn(csvExport, 'downloadCsv').mockImplementation(() => {});

    renderWithClient(
      <MemoryRouter>
        <EvidencePage />
      </MemoryRouter>
    );

    const exportBtn = screen.getByRole('button', { name: /Export CSV/i });
    await userEvent.click(exportBtn);

    expect(downloadSpy).toHaveBeenCalledTimes(1);
    expect(downloadSpy).toHaveBeenCalledWith(
      expect.stringMatching(/^fiduciary-evidence-audit/),
      expect.any(String)
    );

    downloadSpy.mockRestore();
    vi.unstubAllGlobals();
  });
});
