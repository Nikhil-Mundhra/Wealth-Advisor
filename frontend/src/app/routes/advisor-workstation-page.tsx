import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Briefcase,
  Copy,
  ExternalLink,
  Eye,
  Link as LinkIcon,
  Plus,
  Shield,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import type { AdvisorClientSummaryDto } from '@wealth-advisor/contracts';
import { Button } from '../../components/ui/button.tsx';
import { cardClassName } from '../../components/ui/card.tsx';
import { PageTitle } from '../../components/ui/page-title.tsx';
import { Spinner } from '../../components/ui/spinner.tsx';
import { authApi } from '../../features/auth/api/auth-api.ts';
import { ClientPortfolioModal } from '../../features/advisor/components/client-portfolio-modal.tsx';
import { InviteClientModal } from '../../features/advisor/components/invite-client-modal.tsx';
import { cn } from '../../lib/cn.ts';
import { formatMoney } from '../../lib/format-money.ts';

export function AdvisorWorkstationPage() {
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<AdvisorClientSummaryDto | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const { data: clientsData, isLoading: loadingClients } = useQuery({
    queryKey: ['advisor', 'clients'],
    queryFn: authApi.listAdvisorClients,
  });

  const { data: invitesData, isLoading: loadingInvites } = useQuery({
    queryKey: ['advisor', 'invites'],
    queryFn: authApi.listAdvisorInvites,
  });

  const clients = clientsData?.clients ?? [];
  const invites = invitesData?.invites ?? [];

  const totalAum = clients.reduce((sum, c) => sum + c.totalValuationBase, 0);

  const handleCopyLink = async (url: string, id: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-gold/15 px-2.5 py-0.5 text-xs font-semibold text-gold dark:text-gold-light border border-gold/30">
              Institutional Terminal
            </span>
            <span className="text-xs text-subtle font-mono">Global Nomads Wealth Partners</span>
          </div>
          <PageTitle className="mt-1">Wealth Analyst Workstation</PageTitle>
          <p className="mt-1 text-xs text-subtle">
            Fiduciary client roster surveillance, cross-border allocation monitoring, and delegated client onboarding.
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          onClick={() => setInviteModalOpen(true)}
          className="self-start sm:self-auto"
        >
          <Plus aria-hidden className="mr-1.5 size-4" />
          Invite Client
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className={cn(cardClassName, 'flex flex-col gap-1')}>
          <div className="flex items-center justify-between text-subtle">
            <span className="text-xs font-medium">Assigned Clients</span>
            <Users aria-hidden className="size-4 text-brand-600 dark:text-brand-400" />
          </div>
          <span className="font-serif text-2xl font-bold text-ink">{clients.length}</span>
          <span className="text-[11px] text-subtle">Active delegation access</span>
        </div>

        <div className={cn(cardClassName, 'flex flex-col gap-1')}>
          <div className="flex items-center justify-between text-subtle">
            <span className="text-xs font-medium">AUM Surveillance</span>
            <TrendingUp aria-hidden className="size-4 text-gold dark:text-gold-light" />
          </div>
          <span className="font-serif text-2xl font-bold text-ink">
            {formatMoney(totalAum, 'EUR')}
          </span>
          <span className="text-[11px] text-subtle">Aggregated client net worth</span>
        </div>

        <div className={cn(cardClassName, 'flex flex-col gap-1')}>
          <div className="flex items-center justify-between text-subtle">
            <span className="text-xs font-medium">Avg Liquid Runway</span>
            <Briefcase aria-hidden className="size-4 text-brand-600 dark:text-brand-400" />
          </div>
          <span className="font-serif text-2xl font-bold text-ink">18.4 Mo</span>
          <span className="text-[11px] text-subtle">Emergency liquidity cushion</span>
        </div>

        <div className={cn(cardClassName, 'flex flex-col gap-1')}>
          <div className="flex items-center justify-between text-subtle">
            <span className="text-xs font-medium">Active Invitations</span>
            <UserCheck aria-hidden className="size-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <span className="font-serif text-2xl font-bold text-ink">{invites.length}</span>
          <span className="text-[11px] text-subtle">Pending client onboarding</span>
        </div>
      </div>

      {/* Client Roster Table */}
      <div className={cn(cardClassName, 'flex flex-col gap-3')}>
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div>
            <h3 className="font-semibold text-ink">Connected Client Roster</h3>
            <p className="text-xs text-subtle">
              Clients who have delegated read-only surveillance to your institutional analyst profile.
            </p>
          </div>
        </div>

        {loadingClients ? (
          <div className="flex justify-center p-8 text-brand-600">
            <Spinner label="Loading client roster..." />
          </div>
        ) : clients.length === 0 ? (
          <div className="rounded-field bg-surface-subtle p-8 text-center">
            <Users aria-hidden className="mx-auto size-8 text-subtle mb-2" />
            <p className="font-medium text-ink text-sm">No clients connected yet</p>
            <p className="mt-1 text-xs text-subtle max-w-sm mx-auto">
              Share your delegation invite link with prospective clients. When they sign up or connect your code, their portfolio appears here automatically.
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-4 h-9 px-3 text-xs"
              onClick={() => setInviteModalOpen(true)}
            >
              Generate First Invite Link
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-field border border-line">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle border-b border-line text-subtle">
                <tr>
                  <th className="px-3 py-2.5 font-medium">Client</th>
                  <th className="px-3 py-2.5 font-medium">Net Worth</th>
                  <th className="px-3 py-2.5 font-medium">Runway</th>
                  <th className="px-3 py-2.5 font-medium">Risk Profile</th>
                  <th className="px-3 py-2.5 font-medium">Connected</th>
                  <th className="px-3 py-2.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-ink">
                {clients.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="px-3 py-3">
                      <div className="font-medium text-ink">{c.displayName ?? 'Private Client'}</div>
                      <div className="text-subtle text-[11px] font-mono">{c.email}</div>
                    </td>
                    <td className="px-3 py-3 font-mono font-semibold tabular-nums">
                      {formatMoney(c.totalValuationBase, c.currency as any)}
                    </td>
                    <td className="px-3 py-3 font-mono tabular-nums text-brand-600 dark:text-brand-400">
                      {c.runwayMonths} Mo
                    </td>
                    <td className="px-3 py-3">
                      <span className="rounded bg-surface-subtle px-2 py-0.5 text-[11px] font-medium text-subtle border border-line">
                        {c.riskBand}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-subtle text-[11px]">
                      {new Date(c.connectedAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-8 px-2.5 text-xs"
                        onClick={() => setSelectedClient(c)}
                      >
                        <Eye aria-hidden className="mr-1 size-3.5" />
                        Inspect Portfolio
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Active Invitation Links Section */}
      <div className={cn(cardClassName, 'flex flex-col gap-3')}>
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div>
            <h3 className="font-semibold text-ink">Active Client Invitations</h3>
            <p className="text-xs text-subtle">
              Direct links your clients can use to register and automatically grant you advisory delegation.
            </p>
          </div>
        </div>

        {loadingInvites ? (
          <div className="flex justify-center p-4 text-brand-600">
            <Spinner label="Loading invitations..." />
          </div>
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {invites.map((inv) => (
              <li key={inv.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-ink font-mono">{inv.inviteCode}</span>
                    <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                      {inv.status}
                    </span>
                  </div>
                  <p className="text-xs text-subtle">{inv.clientName ?? inv.note ?? 'Direct Delegation Link'}</p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={inv.inviteUrl}
                    className="w-48 sm:w-64 rounded border border-line bg-surface-subtle px-2 py-1 text-[11px] font-mono text-ink focus:outline-none"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="h-7 px-2 text-xs"
                    onClick={() => handleCopyLink(inv.inviteUrl, inv.id)}
                  >
                    <Copy aria-hidden="true" className="mr-1 size-3" />
                    {copiedCode === inv.id ? 'Copied' : 'Copy'}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <InviteClientModal open={inviteModalOpen} onOpenChange={setInviteModalOpen} />
      <ClientPortfolioModal
        open={!!selectedClient}
        onOpenChange={(open) => !open && setSelectedClient(null)}
        client={selectedClient}
      />
    </div>
  );
}
