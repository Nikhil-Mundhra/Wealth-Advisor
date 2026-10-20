import { Download, FileJson } from 'lucide-react';
import type { ExecutedTradeDto } from '@wealth-advisor/contracts';
import { Button } from '../../components/ui/button.tsx';
import { PageTitle } from '../../components/ui/page-title.tsx';
import { downloadCsv, serializeLedgerToCsv, type LedgerRow } from '../../lib/csv-export.ts';
import { DEMO_LEDGER } from '../../lib/demo-data.ts';
import { useStrings } from '../../lib/dictionaries.ts';
import { downloadJson, serializeLedgerToJson } from '../../lib/json-export.ts';
import { useReveal } from '../../lib/use-reveal.ts';
import { useSandboxLedger } from '../../features/wealth/api/use-sandbox-ledger.ts';
import { SettingsNav } from './settings-nav.tsx';

interface DisplayEntry {
  action: string;
  at: string;
  tier: string;
  digest: string;
  passkeyVerified: boolean;
  status: string;
  fullDigest: string | null;
  initialHash: string | null;
  resultingHash: string | null;
  transactionHash: string | null;
  trades: string[];
  // Raw API values for export fidelity; null for the demo baseline, which only has display strings.
  rawTimestamp: string | null;
  rawTrades: ExecutedTradeDto[] | null;
}

// Tamper-evident sandbox executions with audit digests, settings subnav and CSV/JSON export.
export function SettingsLedgerPage() {
  const strings = useStrings();
  const { ref, visible } = useReveal<HTMLDivElement>();
  const { data: ledgerData, isLoading } = useSandboxLedger();

  const liveEntries: DisplayEntry[] = (ledgerData?.entries ?? []).map((entry) => {
    const tradeSummary = entry.executedTrades && entry.executedTrades.length > 0
      ? entry.executedTrades.map((t) => `${t.action} ${t.assetSymbol} (${(t.targetWeight * 100).toFixed(0)}%)`).join(', ')
      : entry.orderType.replace(/_/g, ' ');

    return {
      action: tradeSummary,
      at: new Date(entry.timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      tier: 'TIER_3_EXECUTE',
      digest: entry.auditDigest.slice(0, 16) + '…',
      passkeyVerified: Boolean(entry.passkeyAssertionProof?.signature),
      status: entry.status,
      fullDigest: entry.auditDigest,
      initialHash: entry.initialPortfolioStateHash,
      resultingHash: entry.resultingPortfolioStateHash,
      transactionHash: entry.transactionHash,
      trades: (entry.executedTrades ?? []).map(
        (t) => `${t.action} ${t.assetSymbol} → ${(t.targetWeight * 100).toFixed(0)}% target`,
      ),
      rawTimestamp: entry.timestamp,
      rawTrades: entry.executedTrades,
    };
  });

  const displayEntries: DisplayEntry[] = liveEntries.length > 0 ? liveEntries : DEMO_LEDGER.map((e) => ({
    action: e.action,
    at: e.at,
    tier: e.tier,
    digest: e.digest,
    passkeyVerified: e.tier === 'TIER_3_EXECUTE',
    status: 'COMMITTED',
    fullDigest: null,
    initialHash: null,
    resultingHash: null,
    transactionHash: null,
    trades: [],
    rawTimestamp: null,
    rawTrades: null,
  }));

  const isLive = liveEntries.length > 0;

  function handleExportCsv() {
    const rows: LedgerRow[] = displayEntries.map((entry) => ({
      timestamp: entry.at,
      action: entry.action,
      tier: entry.tier,
      auditDigest: entry.fullDigest ?? entry.digest,
      passkeyProofPresent: entry.passkeyVerified,
    }));
    const csv = serializeLedgerToCsv(rows, {
      period: 'September 2026',
      baselineCurrency: 'EUR',
    });
    downloadCsv('tax-sandbox-ledger-2026-09.csv', csv);
  }

  function handleExportJson() {
    const entries = displayEntries.map((entry) => ({
      timestamp: entry.rawTimestamp ?? entry.at,
      action: entry.action,
      tier: entry.tier,
      auditDigest: entry.fullDigest ?? entry.digest,
      passkeyProofPresent: entry.passkeyVerified,
      status: entry.status,
      initialPortfolioStateHash: entry.initialHash,
      resultingPortfolioStateHash: entry.resultingHash,
      transactionHash: entry.transactionHash,
      executedTrades: entry.rawTrades ?? entry.trades,
    }));
    downloadJson(
      'tax-sandbox-ledger-2026-09.json',
      serializeLedgerToJson(entries, {
        period: 'September 2026',
        baselineCurrency: 'EUR',
        source: isLive ? 'live-api' : 'demo-baseline',
      }),
    );
  }

  return (
    <div
      ref={ref}
      className={`flex flex-col gap-6 motion-safe:transition-all motion-safe:duration-500 ${
        visible
          ? 'motion-safe:translate-y-0 motion-safe:opacity-100'
          : 'motion-safe:translate-y-3 motion-safe:opacity-0'
      }`}
    >
      <div className="flex flex-col gap-4">
        <PageTitle>{strings['header.settings']}</PageTitle>
        <SettingsNav />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold tracking-tight">{strings['settings.ledger']}</h2>
          {isLive ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live API Logs ({liveEntries.length} Sandbox {liveEntries.length === 1 ? 'Record' : 'Records'})
            </span>
          ) : (
            <span className="rounded-full bg-surface-subtle px-2.5 py-0.5 text-xs font-medium text-subtle">
              Fiduciary Sandbox Ledger
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleExportJson}
            className="flex items-center gap-2"
          >
            <FileJson aria-hidden className="size-4" />
            <span>{strings['settings.ledger.exportJson']}</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleExportCsv}
            className="flex items-center gap-2"
          >
            <Download aria-hidden className="size-4" />
            <span>{strings['settings.ledger.export']}</span>
          </Button>
        </div>
      </div>

      <section
        aria-label={strings['settings.ledger']}
        className="overflow-hidden rounded-field border border-line bg-surface"
      >
        {displayEntries.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-subtle">
                <th scope="col" className="px-4 py-3 font-medium">
                  {strings['settings.ledger.action']}
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  {strings['settings.ledger.tier']}
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  {strings['settings.ledger.passkey']}
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  {strings['settings.ledger.digest']}
                </th>
              </tr>
            </thead>
            <tbody>
              {displayEntries.map((entry) => (
                <tr
                  key={entry.fullDigest ?? entry.digest}
                  className="border-b border-line transition-colors last:border-0 motion-safe:hover:bg-surface-subtle"
                >
                  <th scope="row" className="px-4 py-3 text-left font-normal">
                    {entry.action}
                    <span className="block text-xs text-subtle">{entry.at}</span>
                    {entry.initialHash && entry.resultingHash ? (
                      <details className="mt-1 text-xs">
                        <summary className="cursor-pointer text-brand-700 dark:text-brand-900">
                          Before → after state diff
                        </summary>
                        <dl className="mt-1.5 flex flex-col gap-1 font-mono text-[11px] text-subtle">
                          <div className="flex gap-1.5">
                            <dt>Before:</dt>
                            <dd className="break-all">{entry.initialHash}</dd>
                          </div>
                          <div className="flex gap-1.5">
                            <dt>After:</dt>
                            <dd className="break-all">{entry.resultingHash}</dd>
                          </div>
                          {entry.trades.map((trade) => (
                            <div key={trade} className="flex gap-1.5">
                              <dt>Trade:</dt>
                              <dd className="break-all">{trade}</dd>
                            </div>
                          ))}
                        </dl>
                      </details>
                    ) : null}
                  </th>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        entry.tier === 'TIER_3_EXECUTE'
                          ? 'bg-gold-subtle text-gold'
                          : 'bg-surface-subtle text-subtle'
                      }`}
                    >
                      {entry.tier}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        entry.passkeyVerified
                          ? 'bg-brand-500/10 text-brand-700 dark:text-brand-600'
                          : 'bg-surface-subtle text-subtle'
                      }`}
                    >
                      {entry.passkeyVerified ? 'Verified' : 'None'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs">{entry.digest}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="p-6 text-center text-sm text-subtle">
            {strings['settings.ledger.empty']}
          </p>
        )}
      </section>
    </div>
  );
}
