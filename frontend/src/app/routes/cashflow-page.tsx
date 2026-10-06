import { ArrowLeftRight } from 'lucide-react';
import { Navigate } from 'react-router';
import { Card } from '../../components/ui/card.tsx';
import { PageTitle } from '../../components/ui/page-title.tsx';
import { useMe } from '../../features/auth/api/use-me.ts';
import { useProfile } from '../../features/profiling/profile-store.ts';
import { DEMO_ACCOUNTS, DEMO_REMITTANCES } from '../../lib/demo-data.ts';
import { useStrings } from '../../lib/dictionaries.ts';
import { formatMoney } from '../../lib/format-money.ts';
import { useReveal } from '../../lib/use-reveal.ts';

// Multi-currency balances and remittance corridor plan.
export function CashflowPage() {
  const strings = useStrings();
  const { data: me } = useMe();
  const isDemo = !me || me.email === 'testing@example.com';
  const profile = useProfile(me?.email);

  // Non-demo users without completed profiling must onboard first
  if (!isDemo && !profile.isCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  const { ref, visible } = useReveal<HTMLDivElement>();

  const realAccounts =
    !isDemo && profile.answers.holdings.cashSavings.amount > 0
      ? [
          {
            id: 'primary-cash',
            label: 'Primary Cash & Savings',
            balance: profile.answers.holdings.cashSavings.amount,
            currency: profile.answers.holdings.cashSavings.currency,
          },
        ]
      : [];

  const realRemittances =
    !isDemo && profile.answers.countries.remittanceDestinations.length > 0
      ? profile.answers.countries.remittanceDestinations.map((dest) => ({
          corridor: `${profile.answers.countries.residence || 'Primary'} → ${dest}`,
          note: `Active remittance corridor to ${dest}`,
          amount: 'Active',
        }))
      : [];

  return (
    <div
      ref={ref}
      className={`flex flex-col gap-4 motion-safe:transition-all motion-safe:duration-500 ${
        visible
          ? 'motion-safe:translate-y-0 motion-safe:opacity-100'
          : 'motion-safe:translate-y-3 motion-safe:opacity-0'
      }`}
    >
      <PageTitle>{strings['nav.cashflow']}</PageTitle>

      <Card aria-label={strings['cashflow.accounts']}>
        <h2 className="text-sm font-medium text-subtle">{strings['cashflow.accounts']}</h2>
        {isDemo ? (
          <dl className="mt-3 grid gap-3 sm:grid-cols-3">
            {DEMO_ACCOUNTS.map((account) => (
              <div key={account.id} className="rounded-field bg-surface-subtle p-4">
                <dt className="flex items-center justify-between gap-2 text-sm">
                  {account.label}
                  <span className="rounded-full border border-line bg-surface px-2 py-0.5 text-xs font-medium text-subtle">
                    {account.currency}
                  </span>
                </dt>
                <dd className="mt-1 font-display text-2xl font-semibold tracking-tight">
                  {formatMoney(account.balance, account.currency)}
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
        <h2 className="text-sm font-medium text-subtle">{strings['cashflow.remit']}</h2>
        {isDemo ? (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {DEMO_REMITTANCES.map((remittance) => (
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
