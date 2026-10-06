import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cardClassName } from '../../components/ui/card.tsx';
import { PageTitle } from '../../components/ui/page-title.tsx';
import { Spinner } from '../../components/ui/spinner.tsx';
import { fetchApiKeys, revokeApiKey } from '../../features/admin/api/admin-api.ts';
import { cn } from '../../lib/cn.ts';
import { useStrings } from '../../lib/dictionaries.ts';

export function AdminApiKeysPage() {
  const strings = useStrings();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'api-keys'],
    queryFn: fetchApiKeys,
  });

  const revokeMutation = useMutation({
    mutationFn: revokeApiKey,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'api-keys'] });
    },
  });

  const apiKeys = data?.apiKeys ?? [];

  return (
    <div className="flex flex-col gap-6">
      <PageTitle>{strings['admin.apikeys']}</PageTitle>
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
              <p className="font-mono text-xs text-subtle">{key.keyPrefix}••••••••</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {key.permissions.map((perm) => (
                  <span key={perm} className="rounded bg-surface-subtle px-1.5 py-0.5 text-[11px] font-mono text-subtle">
                    {perm}
                  </span>
                ))}
              </div>
              {key.status === 'ACTIVE' && (
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => revokeMutation.mutate(key.id)}
                    className="text-xs text-red-500 hover:underline"
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
