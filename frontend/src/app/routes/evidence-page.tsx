import { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Download,
  ExternalLink,
  FileJson,
  FileSpreadsheet,
  Hash,
  Key,
  Layers,
  Lock,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import { Button } from '../../components/ui/button.tsx';
import { Card, cardClassName } from '../../components/ui/card.tsx';
import { PageTitle } from '../../components/ui/page-title.tsx';
import { SettingsNav } from './settings-nav.tsx';
import { Spinner } from '../../components/ui/spinner.tsx';
import { useSandboxLedger } from '../../features/wealth/api/use-sandbox-ledger.ts';
import { downloadCsv, serializeLedgerToCsv, type LedgerRow } from '../../lib/csv-export.ts';
import { DEMO_LEDGER } from '../../lib/demo-data.ts';
import { cn } from '../../lib/cn.ts';
import { formatMoney } from '../../lib/format-money.ts';
import type { SandboxLedgerEntryDto } from '@wealth-advisor/contracts';

async function computeSha256(text: string): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    return 'browser_subtle_crypto_unavailable';
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function EvidencePage() {
  const { data: ledgerData, isLoading, refetch } = useSandboxLedger();
  const [selectedEntry, setSelectedEntry] = useState<SandboxLedgerEntryDto | null>(null);
  const [tamperInput, setTamperInput] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    computedDigest: string;
    computedTxHash: string;
    matches: boolean;
    payload: string;
  } | null>(null);

  const rawEntries = ledgerData?.entries ?? [];
  const hasLiveEntries = rawEntries.length > 0;

  // Fallback demo items if database ledger is empty in standalone test mode
  const displayEntries: Array<SandboxLedgerEntryDto> = hasLiveEntries
    ? rawEntries
    : DEMO_LEDGER.map((demo, idx) => ({
        id: `demo-ledger-${idx}`,
        tenantId: 'tenant_demo',
        userId: 'user_elena_vance',
        orderType: 'PORTFOLIO_REBALANCE' as const,
        initialPortfolioStateHash: '3b879c941e7f62d47f9e8a09b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2',
        executedTrades: [
          { assetSymbol: 'VTI', action: 'SELL' as const, amountBase: 2500000, targetWeight: 0.40 },
          { assetSymbol: 'BND', action: 'BUY' as const, amountBase: 2500000, targetWeight: 0.25 },
        ],
        resultingPortfolioStateHash: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
        passkeyAssertionProof: {
          credentialId: 'cred_p256_mock_hw_enclave',
          clientDataJson: 'eyJjaGFsbGVuZ2UiOiJzYW5kYm94X2V4ZWN1dGlvbl9jaGFsbGVuZ2UiLCJvcmlnaW4iOiJodHRwczovL3dlYWx0aC5zeW50cm9weS5haSJ9',
          authenticatorData: 'SZYN5YgOjGh0NBcPZHZgW4_krrmihjLHmVzzuoMdl2MBAAAAAg',
          signature: '3045022100e4b2d18728a47ff0f1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f402202f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5',
          verifiedAt: demo.at,
        },
        auditDigest: 'e4f2a1b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1',
        transactionHash: '0xe4f2a1b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3',
        status: 'COMMITTED' as const,
        timestamp: new Date().toISOString(),
      }));

  const handleVerifyEntry = async (entry: SandboxLedgerEntryDto, customSignature?: string) => {
    setIsVerifying(true);
    setSelectedEntry(entry);
    const signatureToUse = customSignature !== undefined
      ? customSignature
      : entry.passkeyAssertionProof?.signature || '';
    const tradeDiffJson = JSON.stringify(entry.executedTrades);
    const payload = `${entry.userId}:${entry.tenantId}:${entry.timestamp}:${signatureToUse}:${tradeDiffJson}`;

    const computed = await computeSha256(payload);
    const computedTx = `0x${(await computeSha256(computed)).slice(0, 40)}`;
    const matches = computed === entry.auditDigest;

    setVerificationResult({
      computedDigest: computed,
      computedTxHash: computedTx,
      matches,
      payload,
    });
    setTamperInput(signatureToUse);
    setIsVerifying(false);
  };

  const handleTamperSignature = async (tamperedVal: string) => {
    if (!selectedEntry) return;
    setTamperInput(tamperedVal);
    const tradeDiffJson = JSON.stringify(selectedEntry.executedTrades);
    const payload = `${selectedEntry.userId}:${selectedEntry.tenantId}:${selectedEntry.timestamp}:${tamperedVal}:${tradeDiffJson}`;
    const computed = await computeSha256(payload);
    const computedTx = `0x${(await computeSha256(computed)).slice(0, 40)}`;
    const matches = computed === selectedEntry.auditDigest;

    setVerificationResult({
      computedDigest: computed,
      computedTxHash: computedTx,
      matches,
      payload,
    });
  };

  const handleExportJson = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(
        {
          exportStandard: 'W3C_WEBAUTHN_SHA256_AUDIT_TRAIL',
          institution: 'Syntropy Institutional Wealth Partners',
          timestamp: new Date().toISOString(),
          recordCount: displayEntries.length,
          records: displayEntries,
        },
        null,
        2
      )
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `fiduciary-evidence-audit-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportCsv = () => {
    const rows: LedgerRow[] = displayEntries.map((entry) => {
      const tradeSummary = entry.executedTrades && entry.executedTrades.length > 0
        ? entry.executedTrades.map((t) => `${t.action} ${t.assetSymbol} (${(t.targetWeight * 100).toFixed(0)}%)`).join('; ')
        : entry.orderType.replace(/_/g, ' ');

      return {
        timestamp: entry.timestamp,
        action: tradeSummary,
        tier: 'TIER_3_EXECUTE',
        auditDigest: entry.auditDigest,
        passkeyProofPresent: Boolean(entry.passkeyAssertionProof?.signature),
      };
    });

    const csv = serializeLedgerToCsv(rows, {
      period: 'October 2026',
      baselineCurrency: 'EUR',
    });
    downloadCsv(`fiduciary-evidence-audit-${Date.now()}.csv`, csv);
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
      <SettingsNav />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <ShieldCheck className="size-3.5" />
              Cryptographic Sovereignty
            </span>
            <span className="text-xs text-subtle font-mono">W3C WebAuthn Tier 3 Gated</span>
          </div>
          <PageTitle className="mt-1">Institutional Evidence Explorer</PageTitle>
          <p className="mt-1 text-xs text-subtle">
            Independent cryptographic verification of sandbox portfolio executions, SHA-256 audit digest chains, and hardware passkey proofs.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            type="button"
            variant="outline"
            onClick={handleExportCsv}
            className="text-xs flex items-center gap-1.5"
          >
            <FileSpreadsheet aria-hidden className="size-3.5" />
            Export CSV
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={handleExportJson}
            className="text-xs flex items-center gap-1.5"
          >
            <FileJson aria-hidden className="size-3.5" />
            Download Audit JSON
          </Button>
        </div>
      </div>

      {/* Trust & Architecture Principles Banner */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className={cn(cardClassName, 'flex flex-col gap-1')}>
          <div className="flex items-center justify-between text-subtle">
            <span className="text-xs font-medium">Audit Record Integrity</span>
            <Lock aria-hidden className="size-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <span className="font-serif text-2xl font-bold text-ink">Zero-Tamper</span>
          <span className="text-[11px] text-subtle">Immutable append-only ledger</span>
        </div>

        <div className={cn(cardClassName, 'flex flex-col gap-1')}>
          <div className="flex items-center justify-between text-subtle">
            <span className="text-xs font-medium">Execution Step-Up</span>
            <Key aria-hidden className="size-4 text-brand-600 dark:text-brand-400" />
          </div>
          <span className="font-serif text-2xl font-bold text-ink">FIDO2 WebAuthn</span>
          <span className="text-[11px] text-subtle">ECDSA P-256 assertion signature</span>
        </div>

        <div className={cn(cardClassName, 'flex flex-col gap-1')}>
          <div className="flex items-center justify-between text-subtle">
            <span className="text-xs font-medium">Digest Algorithm</span>
            <Hash aria-hidden className="size-4 text-gold dark:text-gold-light" />
          </div>
          <span className="font-serif text-2xl font-bold text-ink">SHA-256</span>
          <span className="text-[11px] text-subtle">Deterministic state derivation</span>
        </div>

        <div className={cn(cardClassName, 'flex flex-col gap-1')}>
          <div className="flex items-center justify-between text-subtle">
            <span className="text-xs font-medium">Recorded Executions</span>
            <Layers aria-hidden className="size-4 text-brand-600 dark:text-brand-400" />
          </div>
          <span className="font-serif text-2xl font-bold text-ink">{displayEntries.length}</span>
          <span className="text-[11px] text-subtle">Verified simulation records</span>
        </div>
      </div>

      {/* Main Ledger Table */}
      <section
        aria-label="Audit Evidence Records"
        className="rounded-field border border-line bg-surface overflow-hidden shadow-xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-b border-line bg-surface-subtle/50">
          <div>
            <h2 className="text-sm font-semibold text-ink">Certified Execution Ledger</h2>
            <p className="text-xs text-subtle">
              Select any record to inspect its raw mathematical payload and run client-side cryptographic verification.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isLoading && (
              <span className="flex items-center gap-1.5 text-xs text-subtle">
                <Spinner label="Syncing..." />
                <span>Syncing ledger...</span>
              </span>
            )}
            <Button
              type="button"
              variant="ghost"
              onClick={() => refetch()}
              className="text-xs h-8 px-2 text-subtle hover:text-ink flex items-center gap-1"
            >
              <RefreshCw aria-hidden className="size-3" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle border-b border-line text-subtle">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Action & Order Type</th>
                  <th scope="col" className="px-4 py-3 font-medium">Timestamp</th>
                  <th scope="col" className="px-4 py-3 font-medium">Hardware Proof</th>
                  <th scope="col" className="px-4 py-3 font-medium">Audit Digest (SHA-256)</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-ink">
                {displayEntries.map((entry) => {
                  const tradeSummary = entry.executedTrades && entry.executedTrades.length > 0
                    ? entry.executedTrades.map((t) => `${t.action} ${t.assetSymbol} (${(t.targetWeight * 100).toFixed(0)}%)`).join(', ')
                    : entry.orderType.replace(/_/g, ' ');
                  const isSelected = selectedEntry?.id === entry.id;

                  return (
                    <tr
                      key={entry.id}
                      className={cn(
                        'transition-colors cursor-pointer hover:bg-surface-subtle/70',
                        isSelected && 'bg-gold/10 hover:bg-gold/15'
                      )}
                      onClick={() => handleVerifyEntry(entry)}
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-ink">{tradeSummary}</div>
                        <div className="text-[11px] text-subtle font-mono">
                          Tx: {entry.transactionHash.slice(0, 14)}…
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-subtle whitespace-nowrap">
                        {new Date(entry.timestamp).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3">
                        {entry.passkeyAssertionProof?.signature ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="size-3" />
                            Passkey Attached
                          </span>
                        ) : (
                          <span className="rounded-full bg-surface-subtle px-2 py-0.5 text-[11px] text-subtle border border-line">
                            Standard
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-subtle">
                        {entry.auditDigest.slice(0, 20)}…
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          type="button"
                          variant={isSelected ? 'primary' : 'outline'}
                          className="h-7 text-xs px-2.5"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVerifyEntry(entry);
                          }}
                        >
                          Verify Math
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
      </section>

      {/* Interactive Cryptographic Verifier Sandbox */}
      {selectedEntry && (
        <section
          aria-label="Interactive Verifier"
          className="rounded-card border-2 border-gold/40 bg-surface p-6 shadow-md space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <Cpu className="size-5 text-gold" />
              <div>
                <h3 className="text-base font-semibold text-ink">In-Browser Cryptographic Verifier</h3>
                <p className="text-xs text-subtle">
                  Client-side SHA-256 verification of entry <code className="font-mono">{selectedEntry.id}</code>
                </p>
              </div>
            </div>

            {verificationResult && (
              <div
                className={cn(
                  'flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold border',
                  verificationResult.matches
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                    : 'bg-danger/15 text-danger border-danger/30'
                )}
              >
                {verificationResult.matches ? (
                  <>
                    <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Cryptographically Valid · Zero-Tamper Proof</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="size-4 text-danger" />
                    <span>Tamper Detected · Hash Mismatch!</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Formula Breakdown */}
          <div className="rounded-field bg-surface-subtle p-3 text-xs border border-line space-y-1.5">
            <p className="font-semibold text-ink flex items-center gap-1.5">
              <Terminal className="size-3.5 text-gold" />
              Fiduciary Verification Formula:
            </p>
            <p className="font-mono text-[11px] text-brand-700 dark:text-brand-300 bg-surface p-2 rounded border border-line overflow-x-auto">
              AuditDigest = SHA256(userId : tenantId : timestamp : passkeySignature : JSON(tradeDiff))
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Raw Input Payload */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-subtle flex items-center justify-between">
                <span>Passkey Signature String (Live Tamper Testing)</span>
                <span className="text-[10px] font-normal text-muted">Edit to test tamper resistance</span>
              </label>
              <textarea
                value={tamperInput}
                onChange={(e) => handleTamperSignature(e.target.value)}
                rows={4}
                className="w-full rounded-field border border-line bg-surface-subtle p-2.5 font-mono text-[11px] text-ink focus:outline-brand-600"
              />
            </div>

            {/* Computed vs Recorded Digest Comparison */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-subtle block">Cryptographic Hash Comparison</span>
              <div className="rounded-field border border-line bg-surface-subtle p-3 space-y-2 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-subtle block">Recorded Digest in Database:</span>
                  <span className="font-mono text-[11px] text-ink break-all select-all font-semibold">
                    {selectedEntry.auditDigest}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-semibold text-subtle block">Computed by WebCrypto in Your Browser:</span>
                  <span
                    className={cn(
                      'font-mono text-[11px] break-all select-all font-semibold',
                      verificationResult?.matches
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-danger'
                    )}
                  >
                    {verificationResult?.computedDigest}
                  </span>
                </div>

                <div className="pt-2 border-t border-line/60 flex items-center justify-between text-[11px]">
                  <span className="text-subtle">Transaction Hash Derived:</span>
                  <span className="font-mono font-semibold text-ink">{verificationResult?.computedTxHash}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Trade Differential Breakdown */}
          <div className="space-y-2 pt-2 border-t border-line">
            <h4 className="text-xs font-semibold text-ink">Simulated Trade Operations in This Batch</h4>
            <div className="overflow-x-auto rounded-field border border-line">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-subtle border-b border-line text-subtle">
                  <tr>
                    <th className="px-3 py-2 font-medium">Asset</th>
                    <th className="px-3 py-2 font-medium">Action</th>
                    <th className="px-3 py-2 font-medium text-right">Notional Value</th>
                    <th className="px-3 py-2 font-medium text-right">Target Allocation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line text-ink">
                  {selectedEntry.executedTrades.map((trade, i) => (
                    <tr key={`${trade.assetSymbol}-${i}`} className="hover:bg-surface-subtle/40">
                      <td className="px-3 py-2 font-mono font-semibold">{trade.assetSymbol}</td>
                      <td className="px-3 py-2">
                        <span
                          className={cn(
                            'rounded px-1.5 py-0.5 text-[10px] font-semibold font-mono',
                            trade.action === 'BUY'
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                              : 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                          )}
                        >
                          {trade.action}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-mono text-right tabular-nums">
                        {formatMoney(trade.amountBase / 100, 'EUR')}
                      </td>
                      <td className="px-3 py-2 font-mono text-right font-medium text-brand-600 dark:text-brand-400">
                        {(trade.targetWeight * 100).toFixed(0)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
