import { useState } from 'react';
import { Link, Navigate } from 'react-router';
import {
  HOUSEHOLD_MODES,
  RUNWAY_HEALTHY_MONTHS,
  type AssetClass,
  type HouseholdMode,
  type RunwayBand,
  runwayBand,
} from '@wealth-advisor/rules';
import { AreaChart } from '../../components/ui/area-chart.tsx';
import { Button } from '../../components/ui/button.tsx';
import { Card } from '../../components/ui/card.tsx';
import { PageTitle } from '../../components/ui/page-title.tsx';
import { useMe } from '../../features/auth/api/use-me.ts';
import { ProfilingModal } from '../../features/profiling/components/profiling-modal.tsx';
import { useProfile } from '../../features/profiling/profile-store.ts';
import { CLASS_CHART } from '../../lib/chart-colors.ts';
import {
  DEMO_BASELINE,
  DEMO_HOUSEHOLD,
  DEMO_NET_WORTH_EUR,
  DEMO_NET_WORTH_SERIES,
  DEMO_RUNWAY_MONTHS,
  DEMO_TARGET_WEIGHTS,
} from '../../lib/demo-data.ts';
import { type StringKey, useStrings } from '../../lib/dictionaries.ts';
import { formatMoney } from '../../lib/format-money.ts';
import { useCountUp } from '../../lib/use-count-up.ts';
import { useReveal } from '../../lib/use-reveal.ts';

const BAND_KEY: Record<RunwayBand, StringKey> = {
  critical: 'runway.critical',
  warning: 'runway.warning',
  healthy: 'runway.healthy',
};

const BAND_TONE: Record<RunwayBand, string> = {
  critical: 'text-danger',
  warning: 'text-brand-700 dark:text-brand-900',
  healthy: 'text-ink',
};

// Net worth hero, runway gauge, rebalance CTA, trail chart, and target allocation.
export function DashboardPage() {
  const strings = useStrings();
  const { data: me } = useMe();
  const isDemo = !me || me.email === 'testing@example.com';
  const profile = useProfile(me?.email);
  const [household, setHousehold] = useState<HouseholdMode>(DEMO_HOUSEHOLD);
  const [profilingOpen, setProfilingOpen] = useState(false);

  // Non-demo users who have not completed profiling must onboard first
  if (!isDemo && !profile.isCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  const primaryCurrency = isDemo
    ? DEMO_BASELINE
    : profile.answers.holdings.cashSavings.currency || DEMO_BASELINE;

  const netWorthBasis = isDemo ? DEMO_NET_WORTH_EUR : profile.totalHoldings;
  const netWorth = useCountUp(netWorthBasis);

  // Runway calculation: demo fixture vs real user's liquid cash buffer
  let displayRunwayMonths = DEMO_RUNWAY_MONTHS;
  if (!isDemo) {
    const liquidCash = profile.answers.holdings.cashSavings.amount;
    const estimatedMonthlyBurn = household === 'INDIVIDUAL' ? 2500 : 5000;
    displayRunwayMonths = Math.round((liquidCash / estimatedMonthlyBurn) * 10) / 10;
  }
  const band = runwayBand(displayRunwayMonths);

  // User asset allocation weights
  const realAllocations: { assetClass: AssetClass; label: string; weight: number }[] =
    !isDemo && profile.totalHoldings > 0
      ? [
          {
            assetClass: 'MONEY_MARKET',
            label: 'Cash Savings',
            weight: Math.round((profile.answers.holdings.cashSavings.amount / profile.totalHoldings) * 100),
          },
          {
            assetClass: 'EQUITY_GLOBAL',
            label: 'Brokerage & Equities',
            weight: Math.round((profile.answers.holdings.brokerageStocks.amount / profile.totalHoldings) * 100),
          },
          {
            assetClass: 'FIXED_INCOME_GOV',
            label: 'Retirement & Pension',
            weight: Math.round((profile.answers.holdings.retirementPension.amount / profile.totalHoldings) * 100),
          },
          {
            assetClass: 'FX_HEDGE',
            label: 'Other Assets',
            weight: Math.round((profile.answers.holdings.otherAssets.amount / profile.totalHoldings) * 100),
          },
        ]
      : [];

  const trailPoints = isDemo ? DEMO_NET_WORTH_SERIES : [netWorthBasis, netWorthBasis];

  const { ref, visible } = useReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={`flex flex-col gap-4 motion-safe:transition-all motion-safe:duration-500 ${
        visible
          ? 'motion-safe:translate-y-0 motion-safe:opacity-100'
          : 'motion-safe:translate-y-3 motion-safe:opacity-0'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageTitle>{strings['nav.dashboard']}</PageTitle>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setProfilingOpen(true)}
            aria-label={strings['profiling.summary.edit']}
          >
            {strings['profiling.badge.risk']} {profile.baseRiskScore} / 10 · {profile.corridorCurrencies.join('/')}
          </Button>
          <div role="group" aria-label={strings['household.group']} className="flex gap-2">
            {HOUSEHOLD_MODES.map((mode) => (
              <Button
                key={mode}
                variant={household === mode ? 'primary' : 'outline'}
                aria-pressed={household === mode}
                onClick={() => setHousehold(mode)}
              >
                {strings[mode === 'INDIVIDUAL' ? 'household.individual' : 'household.family']}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card aria-label={strings['dashboard.networth']} className="sm:col-span-1">
          <p className="text-sm text-subtle">{strings['dashboard.networth']}</p>
          <p className="mt-1 font-display text-4xl font-semibold tracking-tight">
            {formatMoney(Math.round(netWorth), primaryCurrency)}
          </p>
          <p className={`mt-1 text-sm font-medium ${BAND_TONE[band]}`}>
            {displayRunwayMonths} {strings['dashboard.months']} · {strings[BAND_KEY[band]]}
          </p>
          <div
            role="progressbar"
            aria-label={strings['dashboard.runway']}
            aria-valuenow={displayRunwayMonths}
            aria-valuemin={0}
            aria-valuemax={RUNWAY_HEALTHY_MONTHS}
            aria-valuetext={`${displayRunwayMonths} ${strings['dashboard.months']}`}
            className="mt-3 h-2 overflow-hidden rounded-full bg-surface-subtle"
          >
            <div
              className={`h-full rounded-full ${band === 'critical' ? 'bg-danger' : 'bg-brand-600'}`}
              style={{ width: `${Math.min((displayRunwayMonths / RUNWAY_HEALTHY_MONTHS) * 100, 100)}%` }}
            />
          </div>
        </Card>

        <Card aria-label={strings['dashboard.runway']} className="sm:col-span-1">
          <p className="text-sm text-subtle">{strings['dashboard.runway']}</p>
          <p className="mt-1 font-display text-4xl font-semibold tracking-tight">
            {displayRunwayMonths} <span className="text-lg">{strings['dashboard.months']}</span>
          </p>
          <p className="mt-1 text-sm text-subtle">
            {household === 'INDIVIDUAL' ? 3 : 6} {strings['dashboard.months']} ·{' '}
            {strings[household === 'INDIVIDUAL' ? 'household.individual' : 'household.family']}
          </p>
        </Card>

        <Link
          to="/advisory"
          className="rounded-field bg-gradient-to-br from-brand-600 to-brand-700 p-5 text-white transition-transform motion-safe:hover:-translate-y-0.5 dark:text-brand-950"
        >
          <p className="text-sm opacity-80">
            {isDemo ? strings['dashboard.rebalance'] : strings['dashboard.strategy']}
          </p>
          <p className="mt-1 font-display text-2xl font-semibold">
            {isDemo ? strings['dashboard.cta'] : profile.effectiveRiskBand.toUpperCase()}
          </p>
          <p className="mt-3 rounded-field bg-white/20 px-3 py-2 text-center text-sm font-medium">
            {strings['dashboard.review']} →
          </p>
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card aria-label={strings['dashboard.trail']}>
          <p className="text-sm text-subtle">{strings['dashboard.trail']}</p>
          <AreaChart points={trailPoints} label={strings['dashboard.trail']} />
        </Card>

        <Card aria-label={strings['dashboard.allocation']}>
          <p className="text-sm text-subtle">{strings['dashboard.allocation']}</p>
          {isDemo ? (
            <ul className="mt-3 flex flex-col gap-3 text-sm">
              {(Object.keys(DEMO_TARGET_WEIGHTS) as AssetClass[]).map((assetClass) => (
                <li key={assetClass}>
                  <div className="flex items-baseline justify-between gap-3">
                    <p>{assetClass}</p>
                    <p className="font-medium">{DEMO_TARGET_WEIGHTS[assetClass]}%</p>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-subtle">
                    <div
                      className={`h-full rounded-full ${CLASS_CHART[assetClass]}`}
                      style={{ width: `${DEMO_TARGET_WEIGHTS[assetClass]}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : realAllocations.length > 0 ? (
            <ul className="mt-3 flex flex-col gap-3 text-sm">
              {realAllocations.map(({ assetClass, label, weight }) => (
                <li key={assetClass}>
                  <div className="flex items-baseline justify-between gap-3">
                    <p>{label}</p>
                    <p className="font-medium">{weight}%</p>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-subtle">
                    <div
                      className={`h-full rounded-full ${CLASS_CHART[assetClass]}`}
                      style={{ width: `${weight}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-subtle">{strings['portfolio.empty']}</p>
          )}
        </Card>
      </div>

      <ProfilingModal
        open={profilingOpen}
        onClose={() => setProfilingOpen(false)}
        email={me?.email}
      />
    </div>
  );
}
