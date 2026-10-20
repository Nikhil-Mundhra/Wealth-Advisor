import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { Clock, Shield, Sparkles } from 'lucide-react';
import { SharedPlanResponse } from '@wealth-advisor/contracts';
import { Button } from '../../components/ui/button.tsx';
import { Card } from '../../components/ui/card.tsx';
import { PageTitle } from '../../components/ui/page-title.tsx';
import { Spinner } from '../../components/ui/spinner.tsx';
import { CLASS_CHART } from '../../lib/chart-colors.ts';
import { DEMO_BASELINE, DEMO_HOLDINGS } from '../../lib/demo-data.ts';
import { useStrings } from '../../lib/dictionaries.ts';
import { formatMoney } from '../../lib/format-money.ts';
import { apiRequest } from '../../lib/api-client.ts';

export function SharedPlanPage() {
  const { token } = useParams();
  const strings = useStrings();
  const [masked, setMasked] = useState(true);
  const [sharedPlan, setSharedPlan] = useState<SharedPlanResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [liveUnavailable, setLiveUnavailable] = useState(false);

  useEffect(() => {
    if (!token) return;
    let active = true;
    setLoading(true);
    setLiveUnavailable(false);
    apiRequest(`/sharing/${token}`, { response: SharedPlanResponse })
      .then((plan) => {
        if (active) setSharedPlan(plan);
      })
      .catch(() => {
        // Fallback to demo holding baseline when unauthenticated or offline
        if (active) setLiveUnavailable(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  const liveHoldings = sharedPlan?.planSnapshot?.recommendedWeights
    ? Object.entries(sharedPlan.planSnapshot.recommendedWeights).map(([label, weight]) => ({
        label,
        weight: Math.round(weight * 100),
        currentWeight: Math.round((sharedPlan.planSnapshot.currentWeights[label] ?? weight) * 100),
      }))
    : null;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <div className="flex items-center justify-between gap-2 border-b border-line pb-3">
        <p className="truncate text-xs font-mono text-subtle">/share/{token}</p>
        <span className="inline-flex items-center gap-1 rounded-full bg-brand-500/10 px-2.5 py-0.5 text-[11px] font-medium text-brand-700 dark:text-brand-300">
          <Shield className="size-3" />
          Tier 0 Read-Only Plan
        </span>
      </div>

      {loading && (
        <div className="flex justify-center p-8">
          <Spinner label="Loading shared strategy..." />
        </div>
      )}

      {sharedPlan && (
        <div className="rounded-card border border-brand-500/20 bg-brand-500/5 p-4 text-xs text-ink">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-brand-700 dark:text-brand-300">
              Strategy Shared by {sharedPlan.ownerDisplayName}
            </span>
            <span className="flex items-center gap-1 text-subtle">
              <Clock className="size-3" />
              Expires {new Date(sharedPlan.expiresAt).toLocaleDateString()}
            </span>
          </div>
          <p className="mt-1 text-subtle">
            {sharedPlan.privacyMasked
              ? 'This fiduciary plan is privacy-masked. Absolute account valuations are redacted to protect client privacy.'
              : 'Full allocation and portfolio weights unlocked for authorized co-planner review.'}
          </p>
        </div>
      )}

      {liveUnavailable && !sharedPlan && (
        <p className="rounded-field border border-line bg-surface-subtle p-3 text-xs text-subtle">
          Live plan unavailable. Showing the demo allocation baseline.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageTitle>{strings['dashboard.allocation']}</PageTitle>
        <Button variant="outline" aria-pressed={!masked} onClick={() => setMasked((was) => !was)}>
          {masked ? strings['share.amounts'] : strings['share.masked']}
        </Button>
      </div>

      <Card aria-label={strings['dashboard.allocation']}>
        {liveHoldings ? (
          <ul className="flex flex-col gap-4">
            {liveHoldings.map((h, i) => (
              <li key={`${h.label}-${i}`}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <p className="font-medium">{h.label}</p>
                  <p className="font-medium text-brand-600 dark:text-brand-400">
                    {h.weight}% Target
                    <span className="ml-2 text-xs text-subtle font-normal">({h.currentWeight}% Current)</span>
                  </p>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-subtle">
                  <div className="h-full rounded-full bg-brand-600" style={{ width: `${Math.min(h.weight, 100)}%` }} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="flex flex-col gap-4">
            {DEMO_HOLDINGS.map((holding) => (
              <li key={holding.assetClass}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <p>{holding.label}</p>
                  <p className="font-medium">{masked ? `${holding.weight}%` : formatMoney(holding.valueEur, DEMO_BASELINE)}</p>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-subtle">
                  <div className={`h-full rounded-full ${CLASS_CHART[holding.assetClass]}`} style={{ width: `${holding.weight}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {sharedPlan?.planSnapshot?.threePillarRationale && (
        <Card aria-label="Three-Pillar Fiduciary Rationale">
          <div className="flex items-center gap-2 border-b border-line pb-3">
            <Sparkles className="size-4 text-brand-600" />
            <h3 className="font-semibold text-sm text-ink">Three-Pillar Fiduciary Rationale</h3>
          </div>
          <div className="mt-4 flex flex-col gap-3 text-xs leading-relaxed text-muted">
            <div className="rounded-field border border-line bg-surface-subtle p-3">
              <span className="font-semibold text-ink block mb-1">1. Personal Finance Pillar</span>
              <p>{sharedPlan.planSnapshot.threePillarRationale.personalFinance}</p>
            </div>
            <div className="rounded-field border border-line bg-surface-subtle p-3">
              <span className="font-semibold text-ink block mb-1">2. Cross-Border Pillar</span>
              <p>{sharedPlan.planSnapshot.threePillarRationale.crossBorder}</p>
            </div>
            <div className="rounded-field border border-line bg-surface-subtle p-3">
              <span className="font-semibold text-ink block mb-1">3. Wealth Strategy Pillar</span>
              <p>{sharedPlan.planSnapshot.threePillarRationale.wealthStrategy}</p>
            </div>
          </div>
        </Card>
      )}

      <Card aria-label="Stress simulation">
        <div className="flex items-center gap-2 border-b border-line pb-3">
          <Shield className="size-4 text-brand-600" />
          <h3 className="font-semibold text-sm text-ink">Stress Simulation (−5% EUR Shock)</h3>
        </div>
        {sharedPlan?.planSnapshot?.stressTestScenario ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2 text-xs">
            <div className="rounded-field border border-line bg-surface-subtle p-3">
              <span className="font-semibold text-ink block mb-1">FX Shock</span>
              <p className="text-muted">{sharedPlan.planSnapshot.stressTestScenario.fxShockPercent}% adverse move</p>
            </div>
            <div className="rounded-field border border-line bg-surface-subtle p-3">
              <span className="font-semibold text-ink block mb-1">Estimated Drawdown</span>
              <p className="text-muted">{sharedPlan.planSnapshot.stressTestScenario.estimatedDrawdownPercent}% portfolio value</p>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-xs leading-relaxed text-muted">
            Deterministic illustration: a −5% EUR depreciation against CNY/SGD lifts monthly remittance costs by about
            €145. Rebalancing 10% into EUR money-market preserves 6+ months of runway. Live engine scenarios appear
            here once the plan snapshot carries one.
          </p>
        )}
      </Card>

      <footer className="text-center text-[11px] text-subtle">
        Syntropy AI Fiduciary Gateway · Shareable plan snapshots are cryptographically tokenized and read-only.
      </footer>
    </main>
  );
}
