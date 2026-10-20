import { ArrowLeftRight } from 'lucide-react';
import { Navigate } from 'react-router';
import { listHoldingAmounts } from '@wealth-advisor/rules';
import { Card } from '../../components/ui/card.tsx';
import { PageTitle } from '../../components/ui/page-title.tsx';
import { useMe } from '../../features/auth/api/use-me.ts';
import { isDemoEmail, useProfile } from '../../features/profiling/profile-store.ts';
import { useActiveClient } from '../../features/advisor/advisor-store.ts';
import { useAccounts } from '../../features/finance/api/use-accounts.ts';
import { useCashflow } from '../../features/finance/api/use-cashflow.ts';
import { useStrings } from '../../lib/dictionaries.ts';
import { formatMoney } from '../../lib/format-money.ts';
import { useReveal } from '../../lib/use-reveal.ts';

// Multi-currency balances and remittance corridor plan.
export function CashflowPage() {
  const strings = useStrings();
  const { data: me } = useMe();
  const activeClient = useActiveClient();
  const isDemo = isDemoEmail(me?.email);
  const profile = useProfile(me?.email);
  const isElena = isDemo && activeClient.id === 'elena-vance';
  const { data: accountsData } = useAccounts(isElena);
  const { data: cashflowData } = useCashflow(activeClient.householdMode, isElena);
  const { ref, visible } = useReveal<HTMLDivElement>();

  // Non-demo users without completed profiling must onboard first
  if (!isDemo && !profile.isCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  const realAccounts = !isDemo
    ? listHoldingAmounts(profile.answers)
        .filter((holding) => holding.bucket === 'cashSavings' && holding.amount > 0)
        .map((holding) => ({
          id: `cash-${holding.currency}`,
          label: `Cash & Savings (${holding.currency})`,
          balance: holding.amount,
          currency: holding.currency,
        }))
    : [];

  const realRemittances =
    !isDemo && profile.answers.countries.remittanceDestinations.length > 0
      ? profile.answers.countries.remittanceDestinations.map((dest) => ({
          corridor: `${profile.answers.countries.residence || 'Primary'} → ${dest}`,
          note: `Active remittance corridor to ${dest}`,
          amount: 'Active',
        }))
      : [];

  const hasLiveAccounts = Boolean(isElena && accountsData && accountsData.accounts.length > 0);

  const displayDemoAccounts = hasLiveAccounts && accountsData
    ? accountsData.accounts.map((acc) => ({
        id: acc.id,
        label: acc.institutionName,
        institution: acc.accountType.replace(/_/g, ' '),
        balance: Math.round(acc.balance / 100),
        currency: acc.currency,
      }))
    : activeClient.accounts;

  const displayDemoRemittances = isElena && cashflowData && cashflowData.remittanceCorridors.length > 0
    ? cashflowData.remittanceCorridors.map((rc) => ({
        corridor: rc.corridor.replace('_', ' → '),
        note: `Recipient: ${rc.recipientName} · 1 ${rc.sourceCurrency} = ${rc.lastRate.toFixed(2)} ${rc.targetCurrency}`,
        amount: formatMoney(Math.round(rc.monthlyTargetAmount / 100), rc.targetCurrency),
        frequency: 'Monthly Fiduciary Transfer',
      }))
    : activeClient.remittances;

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
        <div>
          <div className="flex items-center gap-2.5">
            <PageTitle>{strings['nav.cashflow']}</PageTitle>
            {hasLiveAccounts && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live API Feed
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-subtle">
            Corridor analytics for <span className="font-semibold text-brand-700 dark:text-brand-900">{activeClient.name}</span> · Monthly Burn: {formatMoney(activeClient.monthlyBurn, activeClient.baseCurrency)} · Liquid Runway: {activeClient.runwayMonths} mos
          </p>
        </div>
      </div>

      <Card aria-label={strings['cashflow.accounts']}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-medium text-subtle">{strings['cashflow.accounts']}</h2>
            {hasLiveAccounts && (
              <span className="rounded-full bg-surface-subtle px-2 py-0.5 text-[11px] font-mono text-subtle">
                /finance/accounts
              </span>
            )}
          </div>
          {isDemo && (
            <span className="text-xs text-subtle">
              Liquid Reserves: {formatMoney(activeClient.liquidReserves, activeClient.baseCurrency)}
            </span>
          )}
        </div>
        {isDemo ? (
          <dl className="mt-3 grid gap-3 sm:grid-cols-3">
            {displayDemoAccounts.map((account) => (
              <div key={account.id} className="rounded-field bg-surface-subtle p-4">
                <dt className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-medium text-ink">{account.label}</span>
                  <span className="rounded-full border border-line bg-surface px-2 py-0.5 text-xs font-medium text-subtle">
                    {account.currency}
                  </span>
                </dt>
                {account.institution && (
                  <p className="text-[11px] text-subtle">{account.institution}</p>
                )}
                <dd className="mt-2 font-display text-2xl font-semibold tracking-tight">
                  {formatMoney(account.balance, account.currency as any)}
                </dd>
              </div>
            ))}
          </dl>
        ) : realAccounts.length > 0 ? (
          <dl className="mt-3 grid gap-3 sm:grid-cols-3">
            {realAccounts.map((account) => (
              <div key={account.id} className="rounded-field bg-surface-subtle p-4">
                <dt className="flex items-center justify-between gap-2 text-sm">
                  {account.label}
                  <span className="rounded-full border border-line bg-surface px-2 py-0.5 text-xs font-medium text-subtle">
                    {account.currency}
                  </span>
                </dt>
                <dd className="mt-1 font-display text-2xl font-semibold tracking-tight">
                  {formatMoney(account.balance, account.currency as any)}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="mt-3 text-sm text-subtle">{strings['cashflow.empty.accounts']}</p>
        )}
      </Card>

      <Card aria-label={strings['cashflow.remit']}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-medium text-subtle">{strings['cashflow.remit']}</h2>
            {isElena && cashflowData && (
              <span className="rounded-full bg-surface-subtle px-2 py-0.5 text-[11px] font-mono text-subtle">
                /finance/cashflow
              </span>
            )}
          </div>
          {isDemo && activeClient.preMeetingBrief.fxShockAlert && (
            <span className="rounded-full bg-gold-subtle px-2 py-0.5 text-xs font-medium text-gold">
              FX Exposure Active
            </span>
          )}
        </div>
        {isDemo ? (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {displayDemoRemittances.map((remittance) => (
              <li
                key={remittance.corridor}
                className="flex items-center gap-3 rounded-field bg-surface-subtle p-4 transition-transform motion-safe:hover:-translate-y-0.5"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-600/15 text-brand-700 dark:text-brand-700">
                  <ArrowLeftRight aria-hidden className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="font-medium">{remittance.corridor}</p>
                  <p className="truncate text-xs text-subtle">{remittance.note}</p>
                  <p className="text-[11px] text-brand-700 dark:text-brand-900">{remittance.frequency}</p>
                </div>
                <p className="ml-auto font-display text-lg font-semibold">{remittance.amount}</p>
              </li>
            ))}
          </ul>
        ) : realRemittances.length > 0 ? (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {realRemittances.map((remittance) => (
              <li
                key={remittance.corridor}
                className="flex items-center gap-3 rounded-field bg-surface-subtle p-4 transition-transform motion-safe:hover:-translate-y-0.5"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-600/15 text-brand-700 dark:text-brand-700">
                  <ArrowLeftRight aria-hidden className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="font-medium">{remittance.corridor}</p>
                  <p className="truncate text-xs text-subtle">{remittance.note}</p>
                </div>
                <p className="ml-auto font-display text-sm font-medium text-subtle">{remittance.amount}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-subtle">{strings['cashflow.empty.corridors']}</p>
        )}
      </Card>
    </div>
  );
}
