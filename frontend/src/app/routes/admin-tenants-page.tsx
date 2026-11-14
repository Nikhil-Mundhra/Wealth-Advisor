import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Plus } from 'lucide-react';
import { CreateTenantRequest, type TenantDto } from '@wealth-advisor/contracts';
import { CURRENCIES, TENANT_PLANS } from '@wealth-advisor/rules';
import { Alert } from '../../components/ui/alert.tsx';
import { Button } from '../../components/ui/button.tsx';
import { cardClassName } from '../../components/ui/card.tsx';
import { FormField } from '../../components/ui/form-field.tsx';
import { Input } from '../../components/ui/input.tsx';
import { PageTitle } from '../../components/ui/page-title.tsx';
import { Spinner } from '../../components/ui/spinner.tsx';
import { createTenant, fetchTenants } from '../../features/admin/api/admin-api.ts';
import { cn } from '../../lib/cn.ts';
import { useStrings } from '../../lib/dictionaries.ts';
import { useContractForm } from '../../lib/forms/use-contract-form.ts';

const SELECT_CLASS_NAME =
  'h-11 w-full rounded-field border border-line bg-surface px-3.5 text-sm text-ink shadow-xs transition-colors focus:border-brand-600 focus:outline-none focus:ring-3 focus:ring-brand-600/15';

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

export function AdminTenantsPage() {
  const strings = useStrings();
  const queryClient = useQueryClient();
  const [createdTenant, setCreatedTenant] = useState<TenantDto | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'tenants'],
    queryFn: fetchTenants,
  });

  const { form, formError, submit, fieldError } = useContractForm(CreateTenantRequest, {
    defaultValues: {
      name: '',
      slug: '',
      plan: 'STARTER',
      settings: {
        baselineCurrency: 'EUR',
        allowedCorridors: ['EUR_CNY', 'GBP_SGD'],
        defaultLlmProvider: 'mock',
        maxMembers: 50,
        requirePasskeyForRebalance: true,
      },
    },
    messages: {},
  });

  const watchedName = form.watch('name');
  const slugDirty = Boolean(form.formState.dirtyFields.slug);

  useEffect(() => {
    if (!slugDirty && watchedName) {
      form.setValue('slug', toSlug(watchedName), { shouldValidate: false });
    }
  }, [watchedName, slugDirty, form]);

  const createMutation = useMutation({
    mutationFn: createTenant,
    onSuccess: (tenant) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'tenants'] });
      setCreatedTenant(tenant);
      form.reset();
    },
  });

  const onSubmit = submit(async (values) => {
    setCreatedTenant(null);
    await createMutation.mutateAsync(values);
  });

  const tenants = data?.tenants ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <PageTitle>{strings['admin.tenants']}</PageTitle>
        <p className="mt-1 text-xs text-subtle">Configure organizations, multi-currency baselines, and participant caps.</p>
      </div>

      <section aria-labelledby="provision-tenant-heading" className={cn(cardClassName, 'flex flex-col gap-4')}>
        <div className="flex items-center gap-2 border-b border-line pb-3">
          <Building2 className="size-4 text-brand-600" aria-hidden="true" />
          <h2 id="provision-tenant-heading" className="text-sm font-semibold text-ink">
            Provision organization
          </h2>
        </div>

        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2" noValidate>
          {formError && (
            <div className="sm:col-span-2">
              <Alert tone="error">{formError}</Alert>
            </div>
          )}

          {createdTenant && (
            <div className="sm:col-span-2">
              <Alert tone="info">
                Provisioned tenant <span className="font-semibold">{createdTenant.name}</span> ({createdTenant.slug}) with{' '}
                {createdTenant.settings.baselineCurrency} baseline.
              </Alert>
            </div>
          )}

          <FormField label="Organization name" error={fieldError('name')}>
            {(control) => (
              <Input
                {...control}
                placeholder="Meridian Family Office"
                {...form.register('name')}
              />
            )}
          </FormField>

          <FormField
            label="Tenant slug"
            hint="Lowercase URL-safe identifier (2-50 chars)."
            error={fieldError('slug')}
          >
            {(control) => (
              <Input
                {...control}
                placeholder="meridian-family-office"
                className="font-mono"
                {...form.register('slug')}
              />
            )}
          </FormField>

          <FormField label="Subscription plan" error={fieldError('plan')}>
            {(control) => (
              <select {...control} className={SELECT_CLASS_NAME} {...form.register('plan')}>
                {TENANT_PLANS.map((plan) => (
                  <option key={plan} value={plan}>
                    {plan}
                  </option>
                ))}
              </select>
            )}
          </FormField>

          <FormField label="Baseline currency" error={fieldError('settings.baselineCurrency')}>
            {(control) => (
              <select {...control} className={SELECT_CLASS_NAME} {...form.register('settings.baselineCurrency')}>
                {CURRENCIES.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            )}
          </FormField>

          <div className="sm:col-span-2 flex justify-end pt-1">
            <Button type="submit" loading={createMutation.isPending}>
              <Plus className="size-4" aria-hidden="true" />
              Create tenant
            </Button>
          </div>
        </form>
      </section>

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
              <div className="mt-2 flex items-center justify-between text-xs text-subtle border-t border-line pt-2 tabular-nums">
                <span>Base: {tenant.settings.baselineCurrency} · Cap: {tenant.settings.maxMembers}</span>
                <span className="text-gold font-medium">{tenant.status}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
