import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  Layers,
  MessagesSquare,
  Plus,
  Shield,
  Sparkles,
  TrendingUp,
  User,
  UserCheck,
  Users,
} from 'lucide-react';
import type { AdvisorClientSummaryDto } from '@wealth-advisor/contracts';
import { Button } from '../../components/ui/button.tsx';
import { Card, cardClassName } from '../../components/ui/card.tsx';
import { PageTitle } from '../../components/ui/page-title.tsx';
import { Spinner } from '../../components/ui/spinner.tsx';
import { authApi } from '../../features/auth/api/auth-api.ts';
import { useMe } from '../../features/auth/api/use-me.ts';
import {
  useActiveClient,
  useAdvisorClients,
  setActiveClient,
  setAdvisorScope,
} from '../../features/advisor/advisor-store.ts';
import { INSTITUTIONAL_INSTRUMENTS } from '../../features/advisor/instruments-data.ts';
import type { AdvisorClient } from '../../features/advisor/types.ts';
import { ClientPortfolioModal } from '../../features/advisor/components/client-portfolio-modal.tsx';
import { InviteClientModal } from '../../features/advisor/components/invite-client-modal.tsx';
import { PreMeetingBriefModal } from '../../features/advisor/components/pre-meeting-brief-modal.tsx';
import { InstrumentComparisonModal } from '../../features/advisor/components/instrument-comparison-modal.tsx';
import { ClientRoster } from '../../features/advisor/components/client-roster.tsx';
import { cn } from '../../lib/cn.ts';
import { formatMoney } from '../../lib/format-money.ts';
import { AdvisoryThread } from './advisory-thread.tsx';

type WorkstationTab = 'overview' | 'active' | 'copilot' | 'instruments' | 'invites';

const PATH_BY_TAB: Record<WorkstationTab, string> = {
  overview: '/advisor',
  active: '/advisor/client',
  copilot: '/advisor/copilot',
  instruments: '/advisor/instruments',
  invites: '/advisor/invites',
};

function tabFromPath(pathname: string): WorkstationTab {
  if (pathname === '/advisor/client') return 'active';
  if (pathname === '/advisor/copilot') return 'copilot';
  if (pathname === '/advisor/instruments') return 'instruments';
  if (pathname === '/advisor/invites') return 'invites';
  return 'overview';
}

export function AdvisorWorkstationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: me } = useMe();
  const isAdmin = Boolean(me?.roles.includes('ADMIN'));

  useEffect(() => {
    setAdvisorScope(me?.email, isAdmin);
  }, [me?.email, isAdmin]);

  const [activeTab, setActiveTab] = useState<WorkstationTab>(() => tabFromPath(location.pathname));

  useEffect(() => {
    setActiveTab(tabFromPath(location.pathname));
  }, [location.pathname]);

  const selectTab = (tab: WorkstationTab) => {
    setActiveTab(tab);
    const targetPath = PATH_BY_TAB[tab];
    if (location.pathname !== targetPath) {
      navigate(targetPath);
    }
  };
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<AdvisorClientSummaryDto | null>(null);
  const [briefOpen, setBriefOpen] = useState(false);
  const [briefClient, setBriefClient] = useState<AdvisorClient | null>(null);
  const [instrumentsOpen, setInstrumentsOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const activeClient = useActiveClient();
  const allClients = useAdvisorClients();

  const { data: clientsData, isLoading: loadingClients } = useQuery({
    queryKey: ['advisor', 'clients'],
    queryFn: authApi.listAdvisorClients,
  });

  const { data: invitesData, isLoading: loadingInvites } = useQuery({
    queryKey: ['advisor', 'invites'],
    queryFn: authApi.listAdvisorInvites,
  });

  const dbClients = clientsData?.clients ?? [];
  const invites = invitesData?.invites ?? [];
  // The roster is local seed data; only a connected account has a backend user id to snapshot a plan for.
  const shareClientId = dbClients.find((client) => client.email.toLowerCase() === activeClient.email.toLowerCase())?.id ?? null;

  // Aggregated valuation across seeded + database clients
  const totalAum = allClients.reduce((sum, c) => sum + c.netWorth, 0);

  const handleCopyLink = async (url: string, id: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleOpenBrief = (client?: AdvisorClient) => {
    setBriefClient(client ?? activeClient);
    setBriefOpen(true);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
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

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            type="button"
            variant="outline"
            onClick={() => setInstrumentsOpen(true)}
            className="text-xs"
          >
            <Layers aria-hidden className="mr-1.5 size-3.5" />
            Compare Instruments
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={() => setInviteModalOpen(true)}
            className="text-xs"
          >
            <Plus aria-hidden className="mr-1.5 size-3.5" />
            Invite Client
          </Button>
        </div>
      </div>

      {/* Advisor View Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line pb-2" role="tablist" aria-label="Advisor Workstation Tabs">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'overview'}
          onClick={() => selectTab('overview')}
          className={cn(
            'flex items-center gap-2 rounded-field px-4 py-2 text-xs font-semibold transition-colors cursor-pointer',
            activeTab === 'overview'
              ? 'bg-gold/20 text-gold-dark dark:text-gold-light border border-gold/40'
              : 'text-subtle hover:text-ink hover:bg-surface-subtle'
          )}
        >
          <Users aria-hidden className="size-3.5" />
          <span>All Clients Overview ({allClients.length})</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'active'}
          onClick={() => selectTab('active')}
          className={cn(
            'flex items-center gap-2 rounded-field px-4 py-2 text-xs font-semibold transition-colors cursor-pointer',
            activeTab === 'active'
              ? 'bg-gold/20 text-gold-dark dark:text-gold-light border border-gold/40'
              : 'text-subtle hover:text-ink hover:bg-surface-subtle'
          )}
        >
          <User aria-hidden className="size-3.5" />
          <span>Active Client: {activeClient.name}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'copilot'}
          onClick={() => selectTab('copilot')}
          className={cn(
            'flex items-center gap-2 rounded-field px-4 py-2 text-xs font-semibold transition-colors cursor-pointer',
            activeTab === 'copilot'
              ? 'bg-gold/20 text-gold-dark dark:text-gold-light border border-gold/40'
              : 'text-subtle hover:text-ink hover:bg-surface-subtle'
          )}
        >
          <MessagesSquare aria-hidden className="size-3.5" />
          <span>AI Advisory Copilot ({activeClient.name})</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'instruments'}
          onClick={() => selectTab('instruments')}
          className={cn(
            'flex items-center gap-2 rounded-field px-4 py-2 text-xs font-semibold transition-colors cursor-pointer',
            activeTab === 'instruments'
              ? 'bg-gold/20 text-gold-dark dark:text-gold-light border border-gold/40'
              : 'text-subtle hover:text-ink hover:bg-surface-subtle'
          )}
        >
          <Layers aria-hidden className="size-3.5" />
          <span>Instrument Matrix</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'invites'}
          onClick={() => selectTab('invites')}
          className={cn(
            'flex items-center gap-2 rounded-field px-4 py-2 text-xs font-semibold transition-colors cursor-pointer',
            activeTab === 'invites'
              ? 'bg-gold/20 text-gold-dark dark:text-gold-light border border-gold/40'
              : 'text-subtle hover:text-ink hover:bg-surface-subtle'
          )}
        >
          <UserCheck aria-hidden className="size-3.5" />
          <span>Onboarding & Invites ({invites.length})</span>
        </button>
      </div>

      {/* TAB 1: ALL CLIENTS OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-6">
          {/* KPI Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className={cn(cardClassName, 'flex flex-col gap-1')}>
              <div className="flex items-center justify-between text-subtle">
                <span className="text-xs font-medium">Assigned Clients</span>
                <Users aria-hidden className="size-4 text-brand-600 dark:text-brand-400" />
              </div>
              <span className="font-serif text-2xl font-bold text-ink">{allClients.length}</span>
              <span className="text-[11px] text-subtle">Active fiduciary relationships</span>
            </div>

            <div className={cn(cardClassName, 'flex flex-col gap-1')}>
              <div className="flex items-center justify-between text-subtle">
                <span className="text-xs font-medium">AUM Surveillance</span>
                <TrendingUp aria-hidden className="size-4 text-gold dark:text-gold-light" />
              </div>
              <span className="font-serif text-2xl font-bold text-ink">
                {formatMoney(totalAum, 'EUR')}
              </span>
              <span className="text-[11px] text-subtle">Total client book valuation</span>
            </div>

            <div className={cn(cardClassName, 'flex flex-col gap-1')}>
              <div className="flex items-center justify-between text-subtle">
                <span className="text-xs font-medium">Avg Liquid Runway</span>
                <Briefcase aria-hidden className="size-4 text-brand-600 dark:text-brand-400" />
              </div>
              <span className="font-serif text-2xl font-bold text-ink">18.4 Mo</span>
              <span className="text-[11px] text-subtle">Liquidity cushion across book</span>
            </div>

            <div className={cn(cardClassName, 'flex flex-col gap-1')}>
              <div className="flex items-center justify-between text-subtle">
                <span className="text-xs font-medium">Active Invitations</span>
                <UserCheck aria-hidden className="size-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="font-serif text-2xl font-bold text-ink">{invites.length}</span>
              <span className="text-[11px] text-subtle">Pending delegation registrations</span>
            </div>
          </div>

          {/* All Clients Book Grid: Switch active client, open 30s brief */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-ink">Advisor Client Book</h3>
                <p className="text-xs text-subtle">
                  Select any client to switch active surveillance or launch their 30-second pre-meeting brief.
                </p>
              </div>
              <span className="text-xs font-mono text-gold font-medium">
                Active Client: {activeClient.name}
              </span>
            </div>

            <ClientRoster
              onOpenBriefForClient={(c) => handleOpenBrief(c)}
              onOpenClientPortfolio={() => selectTab('active')}
              onOpenClientCopilot={() => selectTab('copilot')}
            />
          </div>

          {/* Connected Database Accounts Table */}
          {dbClients.length > 0 && (
            <div className={cn(cardClassName, 'flex flex-col gap-3')}>
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div>
                  <h3 className="font-semibold text-ink">Live Connected Client Accounts</h3>
                  <p className="text-xs text-subtle">
                    Real-time accounts synchronized from MongoDB with delegated surveillance tokens.
                  </p>
                </div>
              </div>

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
                    {dbClients.map((c) => (
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
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ACTIVE CLIENT FOCUS */}
      {activeTab === 'active' && (
        <div className="flex flex-col gap-6">
          {/* Active Client Spotlight Hero */}
          <div className={cn(cardClassName, 'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-l-4 border-l-gold')}>
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-full bg-gold/20 font-bold text-gold text-base">
                {activeClient.name.split(' ').map((n) => n[0]).join('')}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-ink">{activeClient.name}</h2>
                  <span className="rounded-full bg-surface-subtle px-2 py-0.5 text-[10px] font-medium text-subtle border border-line">
                    {activeClient.householdMode === 'FAMILY_HOUSEHOLD' ? 'Family Household' : 'Individual'}
                  </span>
                </div>
                <p className="text-xs text-subtle">
                  {activeClient.location} · Base Currency: <strong className="text-ink">{activeClient.baseCurrency}</strong> · Risk Score: {activeClient.riskScore}/10 ({activeClient.riskBand})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenBrief(activeClient)}
                className="text-xs"
              >
                <Sparkles aria-hidden className="mr-1.5 size-3.5 text-gold" />
                30s Meeting Brief
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={() => selectTab('copilot')}
                className="text-xs"
              >
                <MessagesSquare aria-hidden className="mr-1.5 size-3.5" />
                Launch Advisory Copilot
              </Button>
            </div>
          </div>

          {/* Active Client Key Metrics */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className={cn(cardClassName, 'flex flex-col gap-1')}>
              <span className="text-xs text-subtle">Net Worth Valuation</span>
              <span className="font-serif text-2xl font-bold text-ink">
                {formatMoney(activeClient.netWorth, activeClient.baseCurrency)}
              </span>
              <span className="text-[11px] text-subtle">Multi-currency consolidated</span>
            </div>

            <div className={cn(cardClassName, 'flex flex-col gap-1')}>
              <span className="text-xs text-subtle">Liquid Cash Runway</span>
              <span className="font-serif text-2xl font-bold text-brand-600 dark:text-brand-400">
                {activeClient.runwayMonths.toFixed(1)} Months
              </span>
              <span className="text-[11px] text-subtle">Monthly burn: {formatMoney(activeClient.monthlyBurn, activeClient.baseCurrency)}</span>
            </div>

            <div className={cn(cardClassName, 'flex flex-col gap-1')}>
              <span className="text-xs text-subtle">Corridor Drift Status</span>
              <span className="font-serif text-base font-semibold text-ink">
                {activeClient.driftAlert ?? 'Within ±5% corridor target'}
              </span>
              <span className="text-[11px] text-subtle">Target rebalancing suggested</span>
            </div>
          </div>

          {/* Holdings Table for Active Client */}
          <div className={cn(cardClassName, 'flex flex-col gap-3')}>
            <h3 className="font-semibold text-ink text-sm">Portfolio Holdings Allocation</h3>
            <div className="overflow-x-auto rounded-field border border-line">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-subtle border-b border-line text-subtle">
                  <tr>
                    <th className="px-3 py-2 font-medium">Asset</th>
                    <th className="px-3 py-2 font-medium">Class</th>
                    <th className="px-3 py-2 font-medium">Currency</th>
                    <th className="px-3 py-2 font-medium text-right">Value</th>
                    <th className="px-3 py-2 font-medium text-right">Current %</th>
                    <th className="px-3 py-2 font-medium text-right">Target %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line text-ink">
                  {activeClient.holdings.map((h, i) => (
                    <tr key={`${h.symbol}-${i}`} className="hover:bg-surface-subtle/50 transition-colors">
                      <td className="px-3 py-2.5 font-medium">{h.label} ({h.symbol})</td>
                      <td className="px-3 py-2.5 text-subtle">{h.assetClass}</td>
                      <td className="px-3 py-2.5 font-mono">{h.currency}</td>
                      <td className="px-3 py-2.5 font-mono text-right font-semibold">{formatMoney(h.value, h.currency)}</td>
                      <td className="px-3 py-2.5 font-mono text-right">{(h.weight * 100).toFixed(1)}%</td>
                      <td className="px-3 py-2.5 font-mono text-right text-brand-600 dark:text-brand-400">{(h.targetWeight * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AI ADVISORY COPILOT FOR ACTIVE CLIENT */}
      {activeTab === 'copilot' && (
        <AdvisoryThread
          key={activeClient.id}
          context={{
            displayName: activeClient.name,
            location: activeClient.location,
            riskLabel: `${activeClient.riskScore}/10`,
            riskBand: activeClient.riskBand,
            baseCurrency: activeClient.baseCurrency,
            householdMode: activeClient.householdMode,
            runwayMonths: activeClient.runwayMonths,
            monthlyBurn: activeClient.monthlyBurn,
            corridors: activeClient.remittances.map((r) => r.corridor),
            shareClientId,
          }}
        />
      )}

      {/* TAB 4: INSTITUTIONAL INSTRUMENT MATRIX */}
      {activeTab === 'instruments' && (
        <div className={cn(cardClassName, 'flex flex-col gap-4')}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
            <div>
              <h3 className="font-semibold text-ink">Institutional UCITS & Sovereign Instrument Matrix</h3>
              <p className="text-xs text-subtle">
                Approved cross-border ETFs, sovereign fixed income, and overnight money market instruments with withholding tax efficiency.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setInstrumentsOpen(true)}
              className="text-xs"
            >
              <Layers aria-hidden className="mr-1.5 size-3.5" />
              Side-by-Side Modal
            </Button>
          </div>

          <div className="overflow-x-auto rounded-field border border-line">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle border-b border-line text-subtle">
                <tr>
                  <th className="px-3 py-2.5 font-medium">Ticker / ISIN</th>
                  <th className="px-3 py-2.5 font-medium">Instrument</th>
                  <th className="px-3 py-2.5 font-medium">Category</th>
                  <th className="px-3 py-2.5 font-medium text-right">TER</th>
                  <th className="px-3 py-2.5 font-medium text-right">Yield</th>
                  <th className="px-3 py-2.5 font-medium text-right">AUM</th>
                  <th className="px-3 py-2.5 font-medium">Domicile & Tax Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-ink">
                {INSTITUTIONAL_INSTRUMENTS.map((inst) => (
                  <tr key={inst.ticker} className="hover:bg-surface-subtle/50">
                    <td className="px-3 py-3 font-mono">
                      <span className="font-bold text-ink block">{inst.ticker}</span>
                      <span className="text-[11px] text-subtle">{inst.isin}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="font-medium text-ink block">{inst.name}</span>
                      <span className="text-[11px] text-subtle">{inst.bestFor}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="rounded bg-surface-subtle px-2 py-0.5 text-[11px] font-medium text-subtle border border-line">
                        {inst.category}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-mono tabular-nums text-right">{inst.ter.toFixed(2)}%</td>
                    <td className="px-3 py-3 font-mono tabular-nums text-right text-brand-600 dark:text-brand-400">
                      {inst.yieldPct.toFixed(2)}%
                    </td>
                    <td className="px-3 py-3 font-mono tabular-nums text-right">€{inst.aumEurB.toFixed(1)}B</td>
                    <td className="px-3 py-3 text-[11px] text-subtle">
                      <strong className="text-ink">{inst.domicile} ({inst.distributionPolicy}):</strong> {inst.taxEfficiencyNote}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: CLIENT INVITATIONS & ONBOARDING */}
      {activeTab === 'invites' && (
        <div className={cn(cardClassName, 'flex flex-col gap-4')}>
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <h3 className="font-semibold text-ink">Active Client Invitations</h3>
              <p className="text-xs text-subtle">
                Direct delegation links your clients can use to register and automatically link to your analyst profile.
              </p>
            </div>
            <Button
              type="button"
              variant="primary"
              onClick={() => setInviteModalOpen(true)}
              className="text-xs"
            >
              <Plus aria-hidden className="mr-1.5 size-3.5" />
              Create New Invite
            </Button>
          </div>

          {loadingInvites ? (
            <div className="flex justify-center p-4 text-brand-600">
              <Spinner label="Loading invitations..." />
            </div>
          ) : invites.length === 0 ? (
            <div className="rounded-field bg-surface-subtle p-8 text-center text-xs text-subtle">
              No active invitations. Create an invite link to onboard a new private client.
            </div>
          ) : (
            <ul className="flex flex-col divide-y divide-line">
              {invites.map((inv) => (
                <li key={inv.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 first:pt-0 last:pb-0">
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
      )}

      {/* Modals */}
      <InviteClientModal open={inviteModalOpen} onOpenChange={setInviteModalOpen} />
      <ClientPortfolioModal
        open={!!selectedClient}
        onOpenChange={(open) => !open && setSelectedClient(null)}
        client={selectedClient}
      />
      <PreMeetingBriefModal
        open={briefOpen}
        onClose={() => setBriefOpen(false)}
        client={briefClient ?? activeClient}
        onNavigateToAdvisory={() => selectTab('copilot')}
      />
      <InstrumentComparisonModal
        open={instrumentsOpen}
        onClose={() => setInstrumentsOpen(false)}
      />
    </div>
  );
}
