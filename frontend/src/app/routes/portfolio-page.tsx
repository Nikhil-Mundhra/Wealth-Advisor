import { Navigate } from 'react-router';
import type { AssetClass } from '@wealth-advisor/rules';
import { PageTitle } from '../../components/ui/page-title.tsx';
import { useMe } from '../../features/auth/api/use-me.ts';
import { useProfile } from '../../features/profiling/profile-store.ts';
import { CLASS_CHART } from '../../lib/chart-colors.ts';
import { DEMO_BASELINE, DEMO_HOLDINGS, DEMO_TARGET_WEIGHTS } from '../../lib/demo-data.ts';
import { useStrings } from '../../lib/dictionaries.ts';
import { formatMoney } from '../../lib/format-money.ts';
import { useReveal } from '../../lib/use-reveal.ts';

const CLASSES = Object.keys(DEMO_TARGET_WEIGHTS) as AssetClass[];

// Every target class renders for demo account; real accounts render user-configured assets from onboarding.
export function PortfolioPage() {
  const strings = useStrings();
  const { data: me } = useMe();
  const isDemo = !me || me.email === 'testing@example.com';
  const profile = useProfile(me?.email);

  // Non-demo users without completed profiling must onboard first
  if (!isDemo && !profile.isCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  const { ref, visible } = useReveal<HTMLDivElement>();

  // Real user holdings mapped from profiling answers
  const realHoldings: { assetClass: AssetClass; label: string; amount: number; currency: string; weight: number }[] =
    !isDemo && profile.totalHoldings > 0
      ? [
          {
            assetClass: 'MONEY_MARKET' as const,
            label: 'Cash Savings',
            amount: profile.answers.holdings.cashSavings.amount,
            currency: profile.answers.holdings.cashSavings.currency,
            weight: Math.round((profile.answers.holdings.cashSavings.amount / profile.totalHoldings) * 100),
          },
          {
            assetClass: 'EQUITY_GLOBAL' as const,
            label: 'Brokerage & Equities',
            amount: profile.answers.holdings.brokerageStocks.amount,
            currency: profile.answers.holdings.brokerageStocks.currency,
            weight: Math.round((profile.answers.holdings.brokerageStocks.amount / profile.totalHoldings) * 100),
          },
          {
            assetClass: 'FIXED_INCOME_GOV' as const,
            label: 'Retirement & Pension',
            amount: profile.answers.holdings.retirementPension.amount,
            currency: profile.answers.holdings.retirementPension.currency,
            weight: Math.round((profile.answers.holdings.retirementPension.amount / profile.totalHoldings) * 100),
          },
          {
            assetClass: 'FX_HEDGE' as const,
            label: 'Other Assets',
            amount: profile.answers.holdings.otherAssets.amount,
            currency: profile.answers.holdings.otherAssets.currency,
            weight: Math.round((profile.answers.holdings.otherAssets.amount / profile.totalHoldings) * 100),
          },
        ].filter((item) => item.amount > 0)
      : [];

  return (
    <div
      ref={ref}
      className={`flex flex-col gap-6 motion-safe:transition-all motion-safe:duration-500 ${
        visible
          ? 'motion-safe:translate-y-0 motion-safe:opacity-100'
          : 'motion-safe:translate-y-3 motion-safe:opacity-0'
      }`}
    >
      <PageTitle>{strings['nav.portfolio']}</PageTitle>
      <section aria-label={strings['portfolio.holdings']} className="overflow-hidden rounded-field border border-line bg-surface">
        {isDemo ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-subtle">
                <th scope="col" className="px-4 py-3 font-medium">{strings['portfolio.holdings']}</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">{strings['portfolio.current']}</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">{strings['portfolio.target']}</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">{strings['portfolio.drift']}</th>
              </tr>
            </thead>
            <tbody>
              {CLASSES.map((assetClass) => {
                const holding = DEMO_HOLDINGS.find((candidate) => candidate.assetClass === assetClass);
                const current = holding?.weight ?? 0;
                const target = DEMO_TARGET_WEIGHTS[assetClass];
                const drift = target - current;
                return (
                  <tr key={assetClass} className="border-b border-line transition-colors last:border-0 motion-safe:hover:bg-surface-subtle">
                    <th scope="row" className="px-4 py-3 text-left font-normal">
                      <span className="flex items-center gap-2.5">
                        <span aria-hidden className={`size-2.5 shrink-0 rounded-full ${CLASS_CHART[assetClass]}`} />
                        {holding?.label ?? assetClass}
                      </span>
                      {holding && <span className="block pl-5 font-display text-xs text-subtle">{formatMoney(holding.valueEur, DEMO_BASELINE)}</span>}
                    </th>
                    <td className="px-4 py-3 text-right font-display font-semibold">{current}%</td>
                    <td className="px-4 py-3 text-right text-subtle">{target}%</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-block min-w-16 rounded-full px-2 py-0.5 text-xs font-medium ${drift === 0 ? 'bg-surface-subtle text-subtle' : 'bg-gold-subtle text-gold'}`}>
                        {drift > 0 ? `+${drift}` : drift}%
                      </span>
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
    </div>
  );
}
