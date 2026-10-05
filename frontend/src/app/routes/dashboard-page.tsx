import { useState } from 'react';
import { Link } from 'react-router';
import { HOUSEHOLD_MODES, RUNWAY_HEALTHY_MONTHS, type AssetClass, type HouseholdMode, type RunwayBand, runwayBand } from '@wealth-advisor/rules';
import { AreaChart } from '../../components/ui/area-chart.tsx';
import { Button } from '../../components/ui/button.tsx';
import { Card } from '../../components/ui/card.tsx';
import { PageTitle } from '../../components/ui/page-title.tsx';
import { CLASS_CHART } from '../../lib/chart-colors.ts';
import { DEMO_BASELINE, DEMO_HOUSEHOLD, DEMO_NET_WORTH_EUR, DEMO_NET_WORTH_SERIES, DEMO_RUNWAY_MONTHS, DEMO_TARGET_WEIGHTS } from '../../lib/demo-data.ts';
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
  const [household, setHousehold] = useState<HouseholdMode>(DEMO_HOUSEHOLD);
  const band = runwayBand(DEMO_RUNWAY_MONTHS);
  const netWorth = useCountUp(DEMO_NET_WORTH_EUR);
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} className={`flex flex-col gap-4 motion-safe:transition-all motion-safe:duration-500 ${visible ? 'motion-safe:translate-y-0 motion-safe:opacity-100' : 'motion-safe:translate-y-3 motion-safe:opacity-0'}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageTitle>{strings['nav.dashboard']}</PageTitle>
        <div role="group" aria-label={strings['household.group']} className="flex gap-2">
          {HOUSEHOLD_MODES.map((mode) => (
            <Button key={mode} variant={household === mode ? 'primary' : 'outline'} aria-pressed={household === mode} onClick={() => setHousehold(mode)}>
              {strings[mode === 'INDIVIDUAL' ? 'household.individual' : 'household.family']}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card aria-label={strings['dashboard.networth']} className="sm:col-span-1">
          <p className="text-sm text-subtle">{strings['dashboard.networth']}</p>
          <p className="mt-1 font-display text-4xl font-semibold tracking-tight">{formatMoney(Math.round(netWorth), DEMO_BASELINE)}</p>
          <p className={`mt-1 text-sm font-medium ${BAND_TONE[band]}`}>
            {DEMO_RUNWAY_MONTHS} {strings['dashboard.months']} · {strings[BAND_KEY[band]]}
          </p>
          <div
            role="progressbar"
            aria-label={strings['dashboard.runway']}
            aria-valuenow={DEMO_RUNWAY_MONTHS}
            aria-valuemin={0}
            aria-valuemax={RUNWAY_HEALTHY_MONTHS}
            aria-valuetext={`${DEMO_RUNWAY_MONTHS} ${strings['dashboard.months']}`}
            className="mt-3 h-2 overflow-hidden rounded-full bg-surface-subtle"
          >
            <div className={`h-full rounded-full ${band === 'critical' ? 'bg-danger' : 'bg-brand-600'}`} style={{ width: `${Math.min((DEMO_RUNWAY_MONTHS / RUNWAY_HEALTHY_MONTHS) * 100, 100)}%` }} />
          </div>
        </Card>

        <Card aria-label={strings['dashboard.runway']} className="sm:col-span-1">
          <p className="text-sm text-subtle">{strings['dashboard.runway']}</p>
          <p className="mt-1 font-display text-4xl font-semibold tracking-tight">
            {DEMO_RUNWAY_MONTHS} <span className="text-lg">{strings['dashboard.months']}</span>
          </p>
          <p className="mt-1 text-sm text-subtle">
            {household === 'INDIVIDUAL' ? 3 : 6} {strings['dashboard.months']} ·{' '}
            {strings[household === 'INDIVIDUAL' ? 'household.individual' : 'household.family']}
          </p>
        </Card>

        <Link to="/advisory" className="rounded-field bg-gradient-to-br from-brand-600 to-brand-700 p-5 text-white transition-transform motion-safe:hover:-translate-y-0.5 dark:text-brand-950">
          <p className="text-sm opacity-80">{strings['dashboard.rebalance']}</p>
          <p className="mt-1 font-display text-2xl font-semibold">{strings['dashboard.cta']}</p>
          <p className="mt-3 rounded-field bg-white/20 px-3 py-2 text-center text-sm font-medium">{strings['dashboard.review']} →</p>
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card aria-label={strings['dashboard.trail']}>
          <p className="text-sm text-subtle">{strings['dashboard.trail']}</p>
          <AreaChart points={DEMO_NET_WORTH_SERIES} label={strings['dashboard.trail']} />
        </Card>

        <Card aria-label={strings['dashboard.allocation']}>
          <p className="text-sm text-subtle">{strings['dashboard.allocation']}</p>
          <ul className="mt-3 flex flex-col gap-3 text-sm">
            {(Object.keys(DEMO_TARGET_WEIGHTS) as AssetClass[]).map((assetClass) => (
              <li key={assetClass}>
                <div className="flex items-baseline justify-between gap-3">
                  <p>{assetClass}</p>
                  <p className="font-medium">{DEMO_TARGET_WEIGHTS[assetClass]}%</p>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-subtle">
                  <div className={`h-full rounded-full ${CLASS_CHART[assetClass]}`} style={{ width: `${DEMO_TARGET_WEIGHTS[assetClass]}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
