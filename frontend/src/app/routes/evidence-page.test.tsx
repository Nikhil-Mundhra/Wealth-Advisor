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

describe('EvidencePage', () => {
  it('renders evidence explorer with trust cards and ledger table', () => {
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
  });

  it('retains the settings tab bar', () => {
    renderWithClient(
      <MemoryRouter>
        <EvidencePage />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: 'Security' })).toHaveAttribute('href', '/settings/security');
    expect(screen.getByRole('link', { name: 'Sandbox ledger' })).toHaveAttribute('href', '/settings/ledger');
    expect(screen.getByRole('link', { name: 'Evidence Explorer' })).toHaveAttribute('href', '/evidence');
    expect(screen.getByRole('link', { name: 'AI & Models' })).toHaveAttribute('href', '/settings/ai');
  });

  it('opens in-browser cryptographic verifier when clicking verify math', async () => {
    renderWithClient(
      <MemoryRouter>
        <EvidencePage />
      </MemoryRouter>
    );

    const verifyBtns = screen.getAllByRole('button', { name: /Verify Math/i });
    expect(verifyBtns.length).toBeGreaterThan(0);

    fireEvent.click(verifyBtns[0]);

    await waitFor(() => {
      expect(screen.getByText('In-Browser Cryptographic Verifier')).toBeInTheDocument();
    });

    expect(screen.getByText(/AuditDigest = SHA256/i)).toBeInTheDocument();
    expect(screen.getByText('Cryptographic Hash Comparison')).toBeInTheDocument();
  });

  it('triggers CSV export when Export CSV is clicked', async () => {
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
  });
});
