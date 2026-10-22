import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { Clock, Shield, Sparkles } from 'lucide-react';
import { SHARING_ERROR_CODES } from '@wealth-advisor/rules';
import type { SharedPlanResponse } from '@wealth-advisor/contracts';
import { Card } from '../../components/ui/card.tsx';
import { PageTitle } from '../../components/ui/page-title.tsx';
import { Spinner } from '../../components/ui/spinner.tsx';
import { ApiError } from '../../lib/api-error.ts';
import { type StringKey, useStrings } from '../../lib/dictionaries.ts';
import { sharingApi } from '../../features/sharing/api/sharing-api.ts';

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; plan: SharedPlanResponse }
  | { status: 'error'; kind: 'expired' | 'notFound' | 'rateLimited' | 'unavailable' };

// A missing token, a deleted plan and an expired one are different answers; collapsing them into demo data hides a
// dead link behind holdings the owner never shared.
function errorKind(error: unknown): 'expired' | 'notFound' | 'rateLimited' | 'unavailable' {
  if (error instanceof ApiError) {
    if (error.code === SHARING_ERROR_CODES.planExpired) return 'expired';
    if (error.code === SHARING_ERROR_CODES.planNotFound) return 'notFound';
    if (error.code === SHARING_ERROR_CODES.rateLimited || error.status === 429) return 'rateLimited';
  }
  return 'unavailable';
}

function errorKey(kind: 'expired' | 'notFound' | 'rateLimited' | 'unavailable'): StringKey {
  if (kind === 'expired') return 'share.error.expired';
  if (kind === 'notFound') return 'share.error.notFound';
  if (kind === 'rateLimited') return 'share.error.rateLimited';
  return 'share.error.unavailable';
}

export function SharedPlanPage() {
  const { token } = useParams();
  const strings = useStrings();
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    if (!token) {
      setState({ status: 'error', kind: 'notFound' });
      return;
    }

    let active = true;
    setState({ status: 'loading' });
    sharingApi
      .get(token)
      .then((plan) => {
        if (active) setState({ status: 'ready', plan });
      })
      .catch((error: unknown) => {
        if (active) setState({ status: 'error', kind: errorKind(error) });
      });

    return () => {
      active = false;
    };
  }, [token]);

  const plan = state.status === 'ready' ? state.plan : null;
  const holdings = plan
    ? Object.entries(plan.planSnapshot.recommendedWeights).map(([label, weight]) => ({
        label,
        weight: Math.round(weight * 100),
        currentWeight: Math.round((plan.planSnapshot.currentWeights[label] ?? weight) * 100),
      }))
    : [];

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <div className="flex items-center justify-between gap-2 border-b border-line pb-3">
        <p className="truncate text-xs font-mono text-subtle">/share/{token}</p>
        <span className="inline-flex items-center gap-1 rounded-full bg-brand-500/10 px-2.5 py-0.5 text-[11px] font-medium text-brand-700 dark:text-brand-300">
          <Shield className="size-3" />
          {strings['share.tier']}
        </span>
      </div>

      {state.status === 'loading' && (
        <div className="flex justify-center p-8">
          <Spinner label={strings['share.loading']} />
        </div>
      )}

      {state.status === 'error' && (
        <Card aria-label={strings['share.error.title']}>
          <p className="text-sm text-ink">{strings[errorKey(state.kind)]}</p>
        </Card>
      )}

      {plan && (
        <>
          <div className="rounded-card border border-brand-500/20 bg-brand-500/5 p-4 text-xs text-ink">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-brand-700 dark:text-brand-300">
                {strings['share.owner'].replace('{name}', plan.ownerDisplayName)}
              </span>
              <span className="flex items-center gap-1 text-subtle">
                <Clock className="size-3" />
                {strings['share.modal.expires'].replace('{date}', new Date(plan.expiresAt).toLocaleDateString())}
              </span>
            </div>
            <p className="mt-1 text-subtle">
              {plan.privacyMasked ? strings['share.maskedNotice'] : strings['share.fullNotice']}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <PageTitle>{strings['dashboard.allocation']}</PageTitle>
          </div>

          <Card aria-label={strings['dashboard.allocation']}>
            {holdings.length > 0 ? (
              <ul className="flex flex-col gap-4">
                {holdings.map((holding) => (
                  <li key={holding.label}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <p className="font-medium">{holding.label}</p>
                      <p className="font-medium text-brand-600 dark:text-brand-400">
                        {holding.weight}% {strings['portfolio.target']}
                        <span className="ml-2 text-xs font-normal text-subtle">
                          ({holding.currentWeight}% {strings['portfolio.current']})
                        </span>
                      </p>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-subtle">
                      <div className="h-full rounded-full bg-brand-600" style={{ width: `${Math.min(holding.weight, 100)}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-subtle">{strings['share.empty']}</p>
            )}
          </Card>

          <Card aria-label={strings['share.pillar.title']}>
            <div className="flex items-center gap-2 border-b border-line pb-3">
              <Sparkles className="size-4 text-brand-600" />
              <h3 className="text-sm font-semibold text-ink">{strings['share.pillar.title']}</h3>
            </div>
            <div className="mt-4 flex flex-col gap-3 text-xs leading-relaxed text-muted">
              <div className="rounded-field border border-line bg-surface-subtle p-3">
                <span className="mb-1 block font-semibold text-ink">{strings['share.pillar.personal']}</span>
                <p>{plan.planSnapshot.threePillarRationale.personalFinance}</p>
              </div>
              <div className="rounded-field border border-line bg-surface-subtle p-3">
                <span className="mb-1 block font-semibold text-ink">{strings['share.pillar.crossBorder']}</span>
                <p>{plan.planSnapshot.threePillarRationale.crossBorder}</p>
              </div>
              <div className="rounded-field border border-line bg-surface-subtle p-3">
                <span className="mb-1 block font-semibold text-ink">{strings['share.pillar.wealth']}</span>
                <p>{plan.planSnapshot.threePillarRationale.wealthStrategy}</p>
              </div>
            </div>
          </Card>

          <Card aria-label={strings['share.stress.title']}>
            <div className="flex items-center gap-2 border-b border-line pb-3">
              <Shield className="size-4 text-brand-600" />
              <h3 className="text-sm font-semibold text-ink">{strings['share.stress.title']}</h3>
            </div>
            {plan.planSnapshot.stressTestScenario ? (
              <>
                <p className="mt-3 text-xs text-subtle">
                  {strings['share.stress.live'].replace('{pct}', String(plan.planSnapshot.stressTestScenario.fxShockPercent))}
                </p>
                <div className="mt-2 grid gap-2 text-xs sm:grid-cols-2">
                  <div className="rounded-field border border-line bg-surface-subtle p-3">
                    <span className="mb-1 block font-semibold text-ink">FX Shock</span>
                    <p className="text-muted">{plan.planSnapshot.stressTestScenario.fxShockPercent}% adverse move</p>
                  </div>
                  <div className="rounded-field border border-line bg-surface-subtle p-3">
                    <span className="mb-1 block font-semibold text-ink">Estimated Drawdown</span>
                    <p className="text-muted">
                      {plan.planSnapshot.stressTestScenario.estimatedDrawdownPercent}% portfolio value
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <p className="mt-3 text-xs leading-relaxed text-muted">{strings['share.stress.none']}</p>
            )}
          </Card>
        </>
      )}

      <footer className="text-center text-[11px] text-subtle">{strings['share.footer']}</footer>
    </main>
  );
}
