import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Copy, KeyRound, Plus } from 'lucide-react';
import { type ApiKeyCreatedResponse, CreateApiKeyRequest } from '@wealth-advisor/contracts';
import { API_KEY_PERMISSIONS } from '@wealth-advisor/rules';
import { Alert } from '../../components/ui/alert.tsx';
import { Button } from '../../components/ui/button.tsx';
import { cardClassName } from '../../components/ui/card.tsx';
import { Checkbox } from '../../components/ui/checkbox.tsx';
import { FormField } from '../../components/ui/form-field.tsx';
import { Input } from '../../components/ui/input.tsx';
import { PageTitle } from '../../components/ui/page-title.tsx';
import { Spinner } from '../../components/ui/spinner.tsx';
import { createApiKey, fetchApiKeys, fetchTenants, revokeApiKey } from '../../features/admin/api/admin-api.ts';
import { cn } from '../../lib/cn.ts';
import { useStrings } from '../../lib/dictionaries.ts';
import { useContractForm } from '../../lib/forms/use-contract-form.ts';

const SELECT_CLASS_NAME =
  'h-11 w-full rounded-field border border-line bg-surface px-3.5 text-sm text-ink shadow-xs transition-colors focus:border-brand-600 focus:outline-none focus:ring-3 focus:ring-brand-600/15';

export function AdminApiKeysPage() {
  const strings = useStrings();
  const queryClient = useQueryClient();
  const [issuedKey, setIssuedKey] = useState<ApiKeyCreatedResponse | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'api-keys'],
    queryFn: fetchApiKeys,
  });

  const { data: tenantsData } = useQuery({
    queryKey: ['admin', 'tenants'],
    queryFn: fetchTenants,
  });

  const tenants = tenantsData?.tenants ?? [];

  const { form, formError, submit, fieldError } = useContractForm(CreateApiKeyRequest, {
    defaultValues: {
      tenantId: '',
      name: '',
      permissions: ['read:analytics'],
      rateLimitPerMinute: 60,
      monthlyTokenQuota: 100000,
    },
    messages: {},
  });

  const currentTenantId = form.watch('tenantId');
  useEffect(() => {
    if (!currentTenantId && tenants.length > 0) {
      form.setValue('tenantId', tenants[0]!.id, { shouldValidate: false });
    }
  }, [currentTenantId, tenants, form]);

  const issueMutation = useMutation({
    mutationFn: createApiKey,
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'api-keys'] });
      setIssuedKey(created);
      setCopiedSecret(false);
      form.reset({
        tenantId: tenants[0]?.id ?? created.apiKey.tenantId,
        name: '',
        permissions: ['read:analytics'],
        rateLimitPerMinute: 60,
        monthlyTokenQuota: 100000,
      });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: revokeApiKey,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'api-keys'] });
    },
  });

  const onSubmit = submit(async (values) => {
    setIssuedKey(null);
    await issueMutation.mutateAsync(values);
  });

  async function handleCopySecret() {
    if (!issuedKey?.secretKey || !navigator.clipboard?.writeText) return;
    await navigator.clipboard.writeText(issuedKey.secretKey);
    setCopiedSecret(true);
  }

  const apiKeys = data?.apiKeys ?? [];
  const permissionsError = fieldError('permissions');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <PageTitle>{strings['admin.apikeys']}</PageTitle>
        <p className="mt-1 text-xs text-subtle">Issue, audit, and revoke programmatic access keys.</p>
      </div>

      <section aria-labelledby="issue-api-key-heading" className={cn(cardClassName, 'flex flex-col gap-4')}>
        <div className="flex items-center gap-2 border-b border-line pb-3">
          <KeyRound className="size-4 text-brand-600" aria-hidden="true" />
          <h2 id="issue-api-key-heading" className="text-sm font-semibold text-ink">
            Issue API key
          </h2>
        </div>

        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2" noValidate>
          {formError && (
            <div className="sm:col-span-2">
              <Alert tone="error">{formError}</Alert>
            </div>
          )}

          {issuedKey && (
            <div className="sm:col-span-2">
              <Alert tone="info" className="flex flex-col gap-2">
                <p>
                  Issued key <span className="font-semibold">{issuedKey.apiKey.name}</span>. Copy the secret now; it cannot be displayed again.
                </p>
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-field border border-line bg-surface px-3 py-2">
                  <code className="font-mono text-xs text-ink break-all">{issuedKey.secretKey}</code>
                  <Button type="button" variant="outline" onClick={handleCopySecret}>
                    {copiedSecret ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
                    {copiedSecret ? 'Copied' : 'Copy secret'}
                  </Button>
                </div>
              </Alert>
            </div>
          )}

          <FormField label="Key label" error={fieldError('name')}>
            {(control) => (
              <Input
                {...control}
                placeholder="Treasury Reporting Runner"
                {...form.register('name')}
              />
            )}
          </FormField>

          <FormField label="Tenant" error={fieldError('tenantId')}>
            {(control) =>
              tenants.length > 0 ? (
                <select {...control} className={SELECT_CLASS_NAME} {...form.register('tenantId')}>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name} ({tenant.slug})
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  {...control}
                  placeholder="tenant-id"
                  className="font-mono"
                  {...form.register('tenantId')}
                />
              )
            }
          </FormField>

          <FormField label="Rate limit (requests / min)" error={fieldError('rateLimitPerMinute')}>
            {(control) => (
              <Input
                {...control}
                type="number"
                min={1}
                className="tabular-nums"
                {...form.register('rateLimitPerMinute', { valueAsNumber: true })}
              />
            )}
          </FormField>

          <FormField label="Monthly token quota" error={fieldError('monthlyTokenQuota')}>
            {(control) => (
              <Input
                {...control}
                type="number"
                min={1}
                className="tabular-nums"
                {...form.register('monthlyTokenQuota', { valueAsNumber: true })}
              />
            )}
          </FormField>

          <fieldset className="sm:col-span-2 flex flex-col gap-2">
            <legend className="text-sm font-medium text-ink">Permissions</legend>
            <div className="flex flex-wrap gap-4 pt-1">
              {API_KEY_PERMISSIONS.map((permission) => (
                <Checkbox
                  key={permission}
                  label={permission}
                  value={permission}
                  {...form.register('permissions')}
                />
              ))}
            </div>
            {permissionsError && <p className="text-sm text-danger">{permissionsError}</p>}
          </fieldset>

          <div className="sm:col-span-2 flex justify-end pt-1">
            <Button type="submit" loading={issueMutation.isPending}>
              <Plus className="size-4" aria-hidden="true" />
              Issue key
            </Button>
          </div>
        </form>
      </section>

      {isLoading ? (
        <div className="flex py-8 justify-center">
          <Spinner label="Loading API keys" />
        </div>
      ) : apiKeys.length === 0 ? (
        <p className="text-sm text-subtle">{strings['admin.none']}</p>
      ) : (
        <ul className="grid gap-3">
          {apiKeys.map((key) => (
            <li key={key.id} className={cn(cardClassName, 'flex flex-col gap-2')}>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-ink">{key.name}</span>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-medium',
                    key.status === 'ACTIVE' ? 'bg-gold-subtle text-gold' : 'bg-surface-subtle text-subtle',
                  )}
                >
                  {key.status}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-subtle tabular-nums">
                <span className="font-mono">{key.keyPrefix}••••••••</span>
                <span>
                  {key.rateLimitPerMinute} rpm · {key.usedTokensThisMonth.toLocaleString()} / {key.monthlyTokenQuota.toLocaleString()} tokens
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {key.permissions.map((perm) => (
                  <span key={perm} className="rounded bg-surface-subtle px-1.5 py-0.5 text-xs font-mono text-subtle">
                    {perm}
                  </span>
                ))}
              </div>
              {key.status === 'ACTIVE' && (
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    disabled={revokeMutation.isPending}
                    onClick={() => revokeMutation.mutate(key.id)}
                    className="min-h-10 px-2 text-xs font-medium text-danger hover:underline disabled:opacity-60"
                  >
                    Revoke
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
