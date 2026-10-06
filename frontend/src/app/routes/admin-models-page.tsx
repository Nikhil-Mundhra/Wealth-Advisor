import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LLM_PROVIDERS, type LlmProvider } from '@wealth-advisor/rules';
import { cardClassName } from '../../components/ui/card.tsx';
import { PageTitle } from '../../components/ui/page-title.tsx';
import { fetchAdminModels, updateAdminModel } from '../../features/admin/api/admin-api.ts';
import { cn } from '../../lib/cn.ts';
import { useStrings } from '../../lib/dictionaries.ts';

export function AdminModelsPage() {
  const strings = useStrings();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['admin', 'models'],
    queryFn: fetchAdminModels,
  });

  const mutation = useMutation({
    mutationFn: (provider: LlmProvider) => updateAdminModel(provider),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'models'] });
    },
  });

  const active = data?.modelSettings.activeProvider ?? 'mock';

  return (
    <div className="flex flex-col gap-6">
      <PageTitle>{strings['admin.models']}</PageTitle>
      <div className="flex flex-col gap-4">
        <ul className={cn(cardClassName, 'flex flex-col gap-2 text-sm')}>
          {LLM_PROVIDERS.map((provider) => {
            const isActive = provider === active;
            return (
              <li key={provider} className="flex items-center justify-between gap-3 py-1">
                <span className="font-mono text-[13px]">{provider}</span>
                {isActive ? (
                  <span className="rounded-full bg-gold-subtle px-2 py-0.5 text-xs font-medium text-gold">
                    {strings['admin.active']}
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={mutation.isPending}
                    onClick={() => mutation.mutate(provider)}
                    className="rounded bg-surface-subtle px-2 py-0.5 text-xs text-subtle hover:text-ink hover:bg-surface border border-line"
                  >
                    Switch
                  </button>
                )}
              </li>
            );
          })}
        </ul>
        {data?.systemHealth && (
          <div className={cn(cardClassName, 'flex flex-col gap-1 text-xs text-subtle')}>
            <p className="font-medium text-ink">System Diagnostics</p>
            <p>Database: {data.systemHealth.database}</p>
            <p>Uptime: {data.systemHealth.uptimeSeconds}s</p>
          </div>
        )}
      </div>
    </div>
  );
}
