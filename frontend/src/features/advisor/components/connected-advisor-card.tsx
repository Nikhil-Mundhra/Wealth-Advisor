import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Briefcase, Check, LinkIcon, ShieldCheck, UserCheck } from 'lucide-react';
import { Button } from '../../../components/ui/button.tsx';
import { cardClassName } from '../../../components/ui/card.tsx';
import { authApi } from '../../auth/api/auth-api.ts';
import { ME_QUERY_KEY } from '../../auth/api/use-me.ts';
import { cn } from '../../../lib/cn.ts';

export function ConnectedAdvisorCard() {
  const queryClient = useQueryClient();
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: advisor, isLoading } = useQuery({
    queryKey: ['me', 'advisor'],
    queryFn: authApi.getConnectedAdvisor,
  });

  const mutation = useMutation({
    mutationFn: authApi.connectAdvisor,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['me', 'advisor'] });
      void queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
      setInviteCode('');
      setError(null);
    },
    onError: () => {
      setError('Invalid or expired invitation code. Please check with your advisor.');
    },
  });

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setError(null);
    mutation.mutate({ inviteCode: inviteCode.trim() });
  };

  if (isLoading) return null;

  return (
    <div className={cn(cardClassName, 'flex flex-col gap-4')}>
      <div className="flex items-center justify-between border-b border-line pb-3">
        <div className="flex items-center gap-2">
          <Briefcase aria-hidden className="size-4 text-brand-600 dark:text-brand-400" />
          <h3 className="font-semibold text-ink">My Wealth Analyst</h3>
        </div>
        {advisor && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
            <UserCheck aria-hidden className="size-3" />
            Connected
          </span>
        )}
      </div>

      {advisor ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-field bg-surface-subtle p-3 border border-line">
            <div>
              <div className="font-medium text-sm text-ink">{advisor.advisorName}</div>
              <div className="text-xs text-subtle font-mono">{advisor.advisorEmail}</div>
              {advisor.firmName && (
                <div className="text-[11px] text-brand-600 dark:text-brand-400 mt-0.5">{advisor.firmName}</div>
              )}
            </div>
            <div className="text-right">
              <span className="text-[11px] text-subtle">Connected since</span>
              <div className="text-xs font-mono text-ink">
                {new Date(advisor.connectedAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-field bg-brand-500/5 p-3 text-xs text-subtle border border-brand-500/20">
            <ShieldCheck aria-hidden className="size-4 shrink-0 text-brand-600 dark:text-brand-400 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              Your analyst has delegated read-only surveillance to review cross-border allocations and draft rebalancing proposals. All trade orders require your explicit, cryptographic passkey approval.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-subtle">
            You are managing your portfolio directly in self-directed mode. If you are working with an institutional wealth analyst, enter their delegation code below to grant them read-only advisory access.
          </p>

          <form onSubmit={handleConnect} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              placeholder="e.g. ADV-..."
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="flex-1 rounded-field border border-line bg-surface px-3 py-1.5 text-xs text-ink placeholder:text-subtle/50 focus:border-brand-600 focus:outline-none"
            />
            <Button type="submit" variant="primary" className="h-9 px-3 text-xs" loading={mutation.isPending} disabled={!inviteCode.trim()}>
              <LinkIcon aria-hidden className="mr-1.5 size-3.5" />
              Connect Analyst
            </Button>
          </form>

          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
        </div>
      )}
    </div>
  );
}
