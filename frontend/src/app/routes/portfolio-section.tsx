import { useState } from 'react';
import { AlertTriangle, Scale, Share2 } from 'lucide-react';
import { listHoldingAmounts, type AssetClass } from '@wealth-advisor/rules';
import { Link, Navigate } from 'react-router';
import { PageTitle } from '../../components/ui/page-title.tsx';
import { Button } from '../../components/ui/button.tsx';
import { MeGate } from '../../features/auth/components/me-gate.tsx';
import { useMe } from '../../features/auth/api/use-me.ts';
import { isDemoEmail, useProfile } from '../../features/profiling/profile-store.ts';
import { CLASS_CHART } from '../../lib/chart-colors.ts';
import { useActiveClient } from '../../features/advisor/advisor-store.ts';
import { InstrumentComparisonModal } from '../../features/advisor/components/instrument-comparison-modal.tsx';
import { ShareStrategyModal } from '../../features/sharing/components/share-strategy-modal.tsx';
import { PortfolioConstructionModal } from '../../features/wealth/components/portfolio-construction-modal.tsx';
import { usePortfolio } from '../../features/wealth/api/use-portfolio.ts';
import { DEMO_BASELINE } from '../../lib/demo-data.ts';
import { useStrings } from '../../lib/dictionaries.ts';
import { formatMoney } from '../../lib/format-money.ts';
import { useReveal } from '../../lib/use-reveal.ts';

export interface PortfolioSectionProps {
  showTitle?: boolean;
}

// Every target class renders for demo account; real accounts render user-configured assets from onboarding.
function PortfolioView({ showTitle = true }: PortfolioSectionProps) {
  const strings = useStrings();
  const { data: me } = useMe();
  const activeClient = useActiveClient();
  const isDemo = isDemoEmail(me?.email);
  const ownerDisplayName = me?.displayName || 'Private Client';
  const profile = useProfile(me?.email);
  const { data: apiPortfolio } = usePortfolio(isDemo && activeClient.id === 'elena-vance');
  const [instrumentModalOpen, setInstrumentModalOpen] = useState(false);
  const [constructionModalOpen, setConstructionModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const { ref, visible } = useReveal<HTMLDivElement>();

  // Non-demo users without completed profiling must onboard first
  if (!isDemo && !profile.isCompleted && showTitle) {
    return <Navigate to="/onboarding" replace />;
  }

  const holdingClasses: Record<string, { assetClass: AssetClass; label: string }> = {
    cashSavings: { assetClass: 'MONEY_MARKET', label: 'Cash Savings' },
    brokerageStocks: { assetClass: 'EQUITY_GLOBAL', label: 'Brokerage & Equities' },
    retirementPension: { assetClass: 'FIXED_INCOME_GOV', label: 'Retirement & Pension' },
    otherAssets: { assetClass: 'FX_HEDGE', label: 'Other Assets' },
  };
  const realHoldings = !isDemo && profile.totalHoldings > 0
    ? listHoldingAmounts(profile.answers)
        .filter((holding) => holding.amount > 0)
        .map((holding) => ({
          ...holdingClasses[holding.bucket],
          label: `${holdingClasses[holding.bucket].label} (${holding.currency})`,
          amount: holding.amount,
          currency: holding.currency,
          weight: Math.round((holding.amount / profile.totalHoldings) * 100),
        }))
    : [];

  const isElena = isDemo && activeClient.id === 'elena-vance';
  // The API snapshots the signed-in caller's portfolio, so the demo roster's other clients cannot be shared: their
  // seeded holdings have no backend plan behind them.
  const canShare = !isDemo || isElena;
  const hasLiveApiData = Boolean(isElena && apiPortfolio && apiPortfolio.holdings.length > 0);

  const displayDemoHoldings = hasLiveApiData && apiPortfolio
    ? apiPortfolio.holdings.map((h) => ({
        assetClass: h.assetClass,
        label: h.assetName,
        symbol: h.assetSymbol,
        weight: Math.round(h.currentWeight * 100),
        targetWeight: Math.round(h.targetWeight * 100),
        value: Math.round(h.marketValueBase / 100),
        currency: apiPortfolio.baseCurrency,
      }))
    : activeClient.holdings;

  return (
    <div
      ref={ref}
      className={`flex flex-col gap-6 motion-safe:transition-all motion-safe:duration-500 ${
        visible
          ? 'motion-safe:translate-y-0 motion-safe:opacity-100'
          : 'motion-safe:translate-y-3 motion-safe:opacity-0'
      }`}
    >
      {showTitle ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <PageTitle>{strings['nav.portfolio']}</PageTitle>
              {hasLiveApiData && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live API Feed
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-subtle">
              Fiduciary allocation review for <span className="font-semibold text-brand-700 dark:text-brand-900">{activeClient.name}</span> · Base: {activeClient.baseCurrency} · Net Worth: {formatMoney(activeClient.netWorth, activeClient.baseCurrency)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setConstructionModalOpen(true)}
              className="gap-1.5 text-brand-700 dark:text-brand-300 border-brand-500/30"
            >
              <Scale className="size-3.5" />
              Construction Engine
            </Button>
            <Button
              variant="outline"
              onClick={() => setInstrumentModalOpen(true)}
            >
              Compare UCITS Products
            </Button>
            {canShare && (
              <Button
                variant="outline"
                onClick={() => setShareModalOpen(true)}
                className="gap-1.5"
              >
                <Share2 className="size-3.5" />
                Share strategy
              </Button>
            )}
            <a
              href="/advisory"
              className="rounded-field bg-brand-600 px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 dark:text-brand-950"
            >
              Propose Rebalance →
            </a>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold tracking-tight">{strings['nav.portfolio']}</h2>
            {hasLiveApiData && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="size-1 rounded-full bg-emerald-500 animate-pulse" />
                Live API
              </span>
            )}
            {isDemo && activeClient.driftAlert && (
              <span className="rounded-full bg-danger/10 px-2 py-0.5 text-xs font-medium text-danger">
                ±5% Drift Alert
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => setConstructionModalOpen(true)}
              className="text-xs text-brand-700 hover:text-brand-800 dark:text-brand-300 gap-1"
            >
              <Scale className="size-3" />
              Construction Engine
            </Button>
            <Button
              variant="ghost"
              onClick={() => setInstrumentModalOpen(true)}
              className="text-xs text-brand-700 hover:text-brand-800 dark:text-brand-900"
            >
              Compare Products
            </Button>
            <a href="/portfolio" className="text-xs text-subtle hover:text-ink">
              {strings['portfolio.holdings']} &rarr;
            </a>
          </div>
        </div>
      )}
      <section aria-label={strings['portfolio.holdings']} className="overflow-hidden rounded-field border border-line bg-surface">
        {isDemo ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-subtle">
                <th scope="col" className="px-4 py-3 font-medium">{strings['portfolio.holdings']}</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">{strings['portfolio.current']}</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">{strings['portfolio.target']}</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">{strings['portfolio.drift']}</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Value</th>
              </tr>
            </thead>
            <tbody>
              {displayDemoHoldings.map((holding) => {
                const current = holding.weight;
                const target = holding.targetWeight;
                const drift = target - current; // target - current: -20% when 40 - 60
                const isBreached = Math.abs(drift) > 5;
                return (
                  <tr key={holding.symbol || holding.assetClass} className="border-b border-line transition-colors last:border-0 motion-safe:hover:bg-surface-subtle">
                    <th scope="row" className="px-4 py-3 text-left font-normal">
                      <span className="flex items-center gap-2.5">
                        <span aria-hidden className={`size-2.5 shrink-0 rounded-full ${CLASS_CHART[holding.assetClass] || 'bg-brand-600'}`} />
                        <span className="font-medium text-ink">{holding.label}</span>
                        {holding.symbol && (
                          <span className="rounded border border-line bg-surface-subtle px-1.5 py-0.5 text-[11px] font-mono text-subtle">
                            {holding.symbol}
                          </span>
                        )}
                      </span>
                    </th>
                    <td className="px-4 py-3 text-right font-display font-semibold">{current}%</td>
                    <td className="px-4 py-3 text-right text-subtle">{target}%</td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`inline-flex items-center gap-1 min-w-16 rounded-full px-2 py-0.5 text-xs font-medium ${
                          isBreached
                            ? 'bg-danger/15 text-danger font-semibold'
                            : drift === 0
                              ? 'bg-surface-subtle text-subtle'
                              : 'bg-gold-subtle text-gold'
                        }`}
                        title={isBreached ? 'Drift exceeds ±5% fiduciary rebalancing corridor' : 'Within ±5% corridor'}
                      >
                        {isBreached && <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden="true" />}
                        <span>{drift > 0 ? `+${drift}` : drift}%{isBreached ? ' Breach' : ''}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-display text-subtle">
                      {formatMoney(holding.value, holding.currency)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : realHoldings.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-subtle">
                <th scope="col" className="px-4 py-3 font-medium">{strings['portfolio.holdings']}</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">{strings['portfolio.current']}</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Value</th>
              </tr>
            </thead>
            <tbody>
              {realHoldings.map((holding) => (
                <tr key={holding.assetClass} className="border-b border-line transition-colors last:border-0 motion-safe:hover:bg-surface-subtle">
                  <th scope="row" className="px-4 py-3 text-left font-normal">
                    <span className="flex items-center gap-2.5">
                      <span aria-hidden className={`size-2.5 shrink-0 rounded-full ${CLASS_CHART[holding.assetClass]}`} />
                      {holding.label}
                    </span>
                  </th>
                  <td className="px-4 py-3 text-right font-display font-semibold">{holding.weight}%</td>
                  <td className="px-4 py-3 text-right font-display text-subtle">
                    {formatMoney(holding.amount, holding.currency as any)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-6 text-center text-sm text-subtle">
            <p>{strings['portfolio.empty']}</p>
          </div>
        )}
      </section>

      <InstrumentComparisonModal
        open={instrumentModalOpen}
        onClose={() => setInstrumentModalOpen(false)}
      />

      <PortfolioConstructionModal
        open={constructionModalOpen}
        onClose={() => setConstructionModalOpen(false)}
        clientName={activeClient.name}
        defaultCurrency={activeClient.baseCurrency}
        defaultRiskScore={activeClient.riskScore}
        initialTotalValue={activeClient.netWorth}
      />

      <ShareStrategyModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        ownerDisplayName={ownerDisplayName}
      />
    </div>
  );
}

// Identity gate: spinner while roles resolve, retry state on lookup failure, never the demo fixture.
export function PortfolioSection({ showTitle = true }: PortfolioSectionProps) {
  return (
    <MeGate>
      <PortfolioView showTitle={showTitle} />
    </MeGate>
  );
}
