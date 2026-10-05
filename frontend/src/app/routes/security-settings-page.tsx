import { PERMISSION_TIERS } from '@wealth-advisor/rules';
import { Alert } from '../../components/ui/alert.tsx';
import { Button } from '../../components/ui/button.tsx';
import { Spinner } from '../../components/ui/spinner.tsx';
import { useLogout } from '../../features/auth/api/use-logout.ts';
import { useMe } from '../../features/auth/api/use-me.ts';
import { useStrings } from '../../lib/dictionaries.ts';

// Session facts, the tier ladder, passkey enrollment state, and sign out.
export function SecuritySettingsPage() {
  const strings = useStrings();
  const me = useMe();
  const logout = useLogout();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">{strings['header.settings']}</h1>

      <section aria-label={strings['security.session']} className="rounded-field border border-line bg-surface p-5">
        <h2 className="text-sm font-medium text-subtle">{strings['security.session']}</h2>
        {me.isPending && <Spinner label="Loading your profile" />}
        {me.isError && <Alert>Could not load your profile.</Alert>}
        {me.data && (
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-subtle">Email</dt>
            <dd>{me.data.email}</dd>
            <dt className="text-subtle">Roles</dt>
            <dd>{me.data.roles.join(', ')}</dd>
          </dl>
        )}
      </section>

      <section aria-label={strings['security.tiers']} className="rounded-field border border-line bg-surface p-5">
        <h2 className="text-sm font-medium text-subtle">{strings['security.tiers']}</h2>
        <ol className="mt-3 flex flex-col gap-2 text-sm">
          {PERMISSION_TIERS.map((tier) => (
            <li key={tier} className="flex items-center justify-between gap-3">
              <span>{tier}</span>
              {tier === 'TIER_3_EXECUTE' && <span className="text-xs text-subtle">biometric</span>}
            </li>
          ))}
        </ol>
      </section>

      <section aria-label={strings['security.passkeys']} className="rounded-field border border-line bg-surface p-5">
        <h2 className="text-sm font-medium text-subtle">{strings['security.passkeys']}</h2>
        <p className="mt-3 text-sm text-subtle">{strings['security.nopasskeys']}</p>
      </section>

      <div>
        <Button variant="outline" loading={logout.isPending} onClick={() => logout.mutate()}>
          {strings['dashboard.signout']}
        </Button>
      </div>
    </div>
  );
}
