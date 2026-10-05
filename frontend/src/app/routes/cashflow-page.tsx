import { DEMO_ACCOUNTS, DEMO_REMITTANCES } from '../../lib/demo-data.ts';
import { useStrings } from '../../lib/dictionaries.ts';
import { formatMoney } from '../../lib/format-money.ts';

// Multi-currency balances and the Asian remittance corridor plan.
export function CashflowPage() {
  const strings = useStrings();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">{strings['nav.cashflow']}</h1>
      <section aria-label={strings['cashflow.accounts']} className="rounded-field border border-line bg-surface p-5">
        <h2 className="text-sm font-medium text-subtle">{strings['cashflow.accounts']}</h2>
        <dl className="mt-3 flex flex-col gap-3">
          {DEMO_ACCOUNTS.map((account) => (
            <div key={account.id} className="flex items-baseline justify-between gap-3">
              <dt>{account.label}</dt>
              <dd className="font-medium">{formatMoney(account.balance, account.currency)}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section aria-label={strings['cashflow.remit']} className="rounded-field border border-line bg-surface p-5">
        <h2 className="text-sm font-medium text-subtle">{strings['cashflow.remit']}</h2>
        <ul className="mt-3 flex flex-col gap-3">
          {DEMO_REMITTANCES.map((remittance) => (
            <li key={remittance.corridor} className="flex items-baseline justify-between gap-3">
              <div>
                <p className="font-medium">{remittance.corridor}</p>
                <p className="text-xs text-subtle">{remittance.note}</p>
              </div>
              <p className="font-medium">{remittance.amount}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
