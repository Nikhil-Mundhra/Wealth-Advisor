import { useQuery } from '@tanstack/react-query';
import { cardClassName } from '../../components/ui/card.tsx';
import { PageTitle } from '../../components/ui/page-title.tsx';
import { Spinner } from '../../components/ui/spinner.tsx';
import { fetchTenants } from '../../features/admin/api/admin-api.ts';
import { cn } from '../../lib/cn.ts';
import { useStrings } from '../../lib/dictionaries.ts';

export function AdminTenantsPage() {
  const strings = useStrings();
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'tenants'],
    queryFn: fetchTenants,
  });

  const tenants = data?.tenants ?? [];

  return (
    <div className="flex flex-col gap-6">
      <PageTitle>{strings['admin.tenants']}</PageTitle>
      {isLoading ? (
        <div className="flex py-8 justify-center">
          <Spinner label="Loading tenants" />
        </div>
      ) : tenants.length === 0 ? (
        <p className="text-sm text-subtle">{strings['admin.none']}</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {tenants.map((tenant) => (
            <li key={tenant.id} className={cn(cardClassName, 'flex flex-col gap-2')}>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-ink">{tenant.name}</span>
                <span className="rounded-full bg-surface-subtle px-2 py-0.5 text-xs text-subtle font-mono">
                  {tenant.plan}
                </span>
              </div>
              <p className="font-mono text-xs text-subtle">slug: {tenant.slug}</p>
              <div className="mt-2 flex items-center justify-between text-xs text-subtle border-t border-line pt-2">
                <span>Base: {tenant.settings.baselineCurrency}</span>
                <span className="text-gold font-medium">{tenant.status}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
