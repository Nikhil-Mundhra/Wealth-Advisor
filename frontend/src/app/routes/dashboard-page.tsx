import { useState } from 'react';
import { HOUSEHOLD_MODES, RUNWAY_HEALTHY_MONTHS, type HouseholdMode, type RunwayBand, runwayBand } from '@wealth-advisor/rules';
import { Button } from '../../components/ui/button.tsx';
import { DEMO_BASELINE, DEMO_HOUSEHOLD, DEMO_NET_WORTH_EUR, DEMO_RUNWAY_MONTHS } from '../../lib/demo-data.ts';
import { type StringKey, useStrings } from '../../lib/dictionaries.ts';
import { formatMoney } from '../../lib/format-money.ts';

const BAND_KEY: Record<RunwayBand, StringKey> = {
  critical: 'runway.critical',
  warning: 'runway.warning',
  healthy: 'runway.healthy',
};

const BAND_TONE: Record<RunwayBand, string> = {
  critical: 'text-danger',
  warning: 'text-brand-700 dark:text-brand-100',
  healthy: 'text-ink',
};

// Net worth in the baseline currency, household toggle, and the burn-rate runway gauge.
export function DashboardPage() {
  const strings = useStrings();
  const [household, setHousehold] = useState<HouseholdMode>(DEMO_HOUSEHOLD);
  const band = runwayBand(DEMO_RUNWAY_MONTHS);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{strings['nav.dashboard']}</h1>
        <div role="group" aria-label={strings['household.group']} className="flex gap-2">
          {HOUSEHOLD_MODES.map((mode) => (
            <Button key={mode} variant={household === mode ? 'primary' : 'outline'} aria-pressed={household === mode} onClick={() => setHousehold(mode)}>
              {strings[mode === 'INDIVIDUAL' ? 'household.individual' : 'household.family']}
            </Button>
          ))}
        </div>
      </div>

      <section aria-label={strings['dashboard.networth']} className="rounded-field border border-line bg-surface p-5">
        <p className="text-sm text-subtle">{strings['dashboard.networth']}</p>
        <p className="mt-1 text-3xl font-semibold tracking-tight">{formatMoney(DEMO_NET_WORTH_EUR, DEMO_BASELINE)}</p>
      </section>

      <section aria-label={strings['dashboard.runway']} className="rounded-field border border-line bg-surface p-5">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm text-subtle">{strings['dashboard.runway']}</p>
          <p className={`text-lg font-semibold ${BAND_TONE[band]}`}>
            {DEMO_RUNWAY_MONTHS} {strings['dashboard.months']} · {strings[BAND_KEY[band]]}
          </p>
        </div>
        <div role="progressbar" aria-valuenow={DEMO_RUNWAY_MONTHS} aria-valuemin={0} aria-valuemax={RUNWAY_HEALTHY_MONTHS} className="mt-3 h-2 overflow-hidden rounded-full bg-surface-subtle">
          <div className={`h-full rounded-full ${band === 'critical' ? 'bg-danger' : 'bg-brand-600'}`} style={{ width: `${Math.min((DEMO_RUNWAY_MONTHS / RUNWAY_HEALTHY_MONTHS) * 100, 100)}%` }} />
        </div>
      </section>
    </div>
  );
}
