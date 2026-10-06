import { useState } from 'react';
import { COUNTRY_CURRENCY_MAP, CURRENCIES, PERMISSION_TIERS, type Currency } from '@wealth-advisor/rules';
import { Alert } from '../../components/ui/alert.tsx';
import { Button } from '../../components/ui/button.tsx';
import { Card } from '../../components/ui/card.tsx';
import { Dialog } from '../../components/ui/dialog.tsx';
import { PageTitle } from '../../components/ui/page-title.tsx';
import { Spinner } from '../../components/ui/spinner.tsx';
import { useDeleteAccount } from '../../features/auth/api/use-delete-account.ts';
import { useLogout } from '../../features/auth/api/use-logout.ts';
import { useMe } from '../../features/auth/api/use-me.ts';
import { setPreferredCurrency, useProfile, wipeUserDataFromBrowser } from '../../features/profiling/profile-store.ts';
import { useStrings } from '../../lib/dictionaries.ts';

// Session facts, the tier ladder, passkey enrollment state, reporting currency, and account controls.
export function SecuritySettingsPage() {
  const strings = useStrings();
  const me = useMe();
  const logout = useLogout();
  const profile = useProfile(me.data?.email);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const deleteAccount = useDeleteAccount(() => {
    wipeUserDataFromBrowser(me.data?.email);
  });
  return (
    <div className="flex flex-col gap-6">
      <PageTitle>{strings['header.settings']}</PageTitle>

      <Card aria-label={strings['security.session']}>
        <h2 className="text-sm font-medium text-subtle">{strings['security.session']}</h2>
        {me.isPending && <Spinner label={strings['security.loading']} />}
        {me.isError && <Alert>{strings['security.loaderror']}</Alert>}
        {me.data && (
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-subtle">{strings['security.email']}</dt>
            <dd>{me.data.email}</dd>
            <dt className="text-subtle">{strings['security.roles']}</dt>
            <dd>{me.data.roles.join(', ')}</dd>
          </dl>
        )}
      </Card>

      <Card aria-label={strings['security.tiers']}>
        <h2 className="text-sm font-medium text-subtle">{strings['security.tiers']}</h2>
        <ol className="mt-3 flex flex-col gap-2 text-sm">
          {PERMISSION_TIERS.map((tier) => (
            <li key={tier} className="flex items-center justify-between gap-3">
              <span>{tier}</span>
              {tier === 'TIER_3_EXECUTE' && <span className="text-xs text-subtle">biometric</span>}
            </li>
          ))}
        </ol>
      </Card>

      <Card aria-label={strings['security.passkeys']}>
        <h2 className="text-sm font-medium text-subtle">{strings['security.passkeys']}</h2>
        <p className="mt-3 text-sm text-subtle">{strings['security.nopasskeys']}</p>
      </Card>

      <Card aria-label="Reporting currency section">
        <label htmlFor="reporting-currency-select" className="text-sm font-medium text-subtle block">
          Reporting currency
        </label>
        <p className="mt-1 text-xs text-subtle">
          Base currency for your portfolio net worth and emergency runway. Defaults to your country of residence (
          {profile.answers.countries.residence || 'DE'}).
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <select
            id="reporting-currency-select"
            value={profile.preferredCurrency}
            onChange={(e) => setPreferredCurrency(e.target.value as Currency, me.data?.email)}
            className="rounded-field border border-line bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-brand-600 min-h-[44px]"
          >
            {CURRENCIES.map((curr) => {
              const resCode = profile.answers.countries.residence?.toUpperCase();
              const isResidence = resCode && COUNTRY_CURRENCY_MAP[resCode] === curr;
              return (
                <option key={curr} value={curr}>
                  {curr} {isResidence ? '(Residence default)' : ''}
                </option>
              );
            })}
          </select>
          <span className="text-xs text-subtle">
            Active reporting: <strong className="text-ink font-medium">{profile.preferredCurrency}</strong>
          </span>
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" loading={logout.isPending} onClick={() => logout.mutate()}>
          {strings['dashboard.signout']}
        </Button>
        <Button
          variant="ghost"
          className="text-danger hover:bg-danger/10 hover:text-danger"
          onClick={() => setConfirmDeleteOpen(true)}
        >
          {strings['security.deleteAccount']}
        </Button>
      </div>

      <Dialog
        open={confirmDeleteOpen}
        onClose={() => !deleteAccount.isPending && setConfirmDeleteOpen(false)}
        title={strings['security.deleteAccount.confirmTitle']}
      >
        <p className="mt-3 text-sm text-subtle">
          {strings['security.deleteAccount.confirmDescription']}
        </p>
        {deleteAccount.isError && (
          <div className="mt-3">
            <Alert>{strings['security.deleteAccount.error']}</Alert>
          </div>
        )}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            disabled={deleteAccount.isPending}
            onClick={() => setConfirmDeleteOpen(false)}
          >
            {strings['security.deleteAccount.cancelButton']}
          </Button>
          <Button
            className="bg-danger text-white hover:opacity-90"
            loading={deleteAccount.isPending}
            onClick={() => deleteAccount.mutate()}
          >
            {strings['security.deleteAccount.confirmButton']}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
