import { useQuery } from '@tanstack/react-query';
import { ShieldCheck } from 'lucide-react';
import type { AdvisorClientSummaryDto } from '@wealth-advisor/contracts';
import { Button } from '../../../components/ui/button.tsx';
import { Dialog } from '../../../components/ui/dialog.tsx';
import { Spinner } from '../../../components/ui/spinner.tsx';
import { wealthApi } from '../../wealth/api/wealth-api.ts';
import { formatMoney } from '../../../lib/format-money.ts';

interface ClientPortfolioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: AdvisorClientSummaryDto | null;
}

export function ClientPortfolioModal({ open, onOpenChange, client }: ClientPortfolioModalProps) {
  const { data: portfolio, isLoading } = useQuery({
    queryKey: ['advisor', 'client-portfolio', client?.id],
    queryFn: () => wealthApi.getPortfolio(client?.id),
    enabled: open && !!client?.id,
  });

  return (
    <Dialog
      open={open}
      onClose={() => onOpenChange(false)}
      title={`Portfolio Surveillance · ${client?.displayName ?? client?.email ?? 'Client'}`}
      className="max-w-2xl"
    >
      <p className="mt-1 text-xs text-subtle mb-4">
        Institutional view for {client?.email}. Read-only delegated surveillance.
      </p>

      {isLoading ? (
        <div className="flex justify-center p-8 text-brand-600">
          <Spinner label="Loading client portfolio..." />
        </div>
      ) : !portfolio ? (
        <div className="rounded-field bg-surface-subtle p-6 text-center text-xs text-subtle">
          No portfolio data available for this account.
        </div>
      ) : (
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-3 gap-3 rounded-field bg-surface-subtle p-3 text-xs border border-line">
            <div>
              <p className="text-subtle">Total Valuation</p>
              <p className="font-serif text-base font-semibold text-ink">
                {formatMoney(portfolio.totalValuationBase, portfolio.baseCurrency)}
              </p>
            </div>
            <div>
              <p className="text-subtle">Holdings Count</p>
              <p className="font-mono text-base font-semibold text-ink">
                {portfolio.holdings.length} Assets
              </p>
            </div>
            <div>
              <p className="text-subtle">Liquid Runway</p>
              <p className="font-mono text-base font-semibold text-brand-600 dark:text-brand-400">
                {client?.runwayMonths ?? 18.4} Months
              </p>
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto rounded-field border border-line">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle border-b border-line text-subtle sticky top-0">
                <tr>
                  <th className="px-3 py-2 font-medium">Asset</th>
                  <th className="px-3 py-2 font-medium">Class</th>
                  <th className="px-3 py-2 font-medium text-right">Value</th>
                  <th className="px-3 py-2 font-medium text-right">Target</th>
                  <th className="px-3 py-2 font-medium text-right">Drift</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-ink">
                {portfolio.holdings.map((h) => {
                  const drift = h.targetWeight - h.currentWeight;
                  return (
                    <tr key={h.assetSymbol} className="hover:bg-surface-subtle/50">
                      <td className="px-3 py-2">
                        <span className="font-medium">{h.assetName}</span>{' '}
                        <span className="text-subtle text-[11px] font-mono">({h.assetSymbol})</span>
                      </td>
                      <td className="px-3 py-2 text-subtle">{h.assetClass}</td>
                      <td className="px-3 py-2 font-mono tabular-nums text-right">
                        {formatMoney(h.marketValueBase, portfolio.baseCurrency)}
                      </td>
                      <td className="px-3 py-2 font-mono tabular-nums text-right">
                        {(h.targetWeight * 100).toFixed(0)}%
                      </td>
                      <td
                        className={`px-3 py-2 font-mono tabular-nums text-right font-medium ${
                          Math.abs(drift) > 0.05
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-subtle'
                        }`}
                      >
                        {drift > 0 ? `+${(drift * 100).toFixed(1)}%` : `${(drift * 100).toFixed(1)}%`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-start gap-2 rounded-field bg-gold/10 p-3 text-xs text-ink border border-gold/30">
            <ShieldCheck aria-hidden className="size-4 shrink-0 text-gold dark:text-gold-light mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong>Cryptographic Sovereignty:</strong> As a Wealth Analyst, you have access to monitor risk drift, run deterministic rebalance models, and prepare pre-meeting briefs. Cryptographic execution of sandbox trades remains strictly reserved for the client&apos;s WebAuthn passkey assertion.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
