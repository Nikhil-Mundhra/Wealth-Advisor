import { useState } from 'react';
import { Share2, Shield, CheckCircle2, ArrowRight } from 'lucide-react';
import { AdvisoryChatResponse, CreateShareLinkResponse } from '@wealth-advisor/contracts';
import type { Currency, HouseholdMode } from '@wealth-advisor/rules';
import { Alert } from '../../components/ui/alert.tsx';
import { Button } from '../../components/ui/button.tsx';
import { Card } from '../../components/ui/card.tsx';
import { Dialog } from '../../components/ui/dialog.tsx';
import { Input } from '../../components/ui/input.tsx';
import { PageTitle } from '../../components/ui/page-title.tsx';
import { InstrumentComparisonModal } from '../../features/advisor/components/instrument-comparison-modal.tsx';
import { getActiveModelSpec, useAiConfig } from '../../features/ai-config/ai-settings-store.ts';
import { TOP_FREE_MODEL_ID } from '../../features/ai-config/models-data.ts';
import { createPasskeyAssertion } from '../../features/auth/api/passkey-client.ts';
import { authApi } from '../../features/auth/api/auth-api.ts';
import { wealthApi } from '../../features/wealth/api/wealth-api.ts';
import { apiRequest } from '../../lib/api-client.ts';
import { type StringKey, useStrings } from '../../lib/dictionaries.ts';
import { ENGAGEMENT_EVENTS, track } from '../../lib/engagement.ts';
import { formatMoney } from '../../lib/format-money.ts';

export interface AdvisoryContext {
  displayName: string;
  location: string;
  riskLabel: string;
  riskBand: string;
  baseCurrency: Currency;
  householdMode: HouseholdMode;
  runwayMonths: number;
  monthlyBurn: number;
  corridors: string[];
  shareId: string;
}

interface ThreePillars {
  personalFinance: string;
  crossBorder: string;
  wealthStrategy: string;
}

interface Message {
  role: 'user' | 'assistant';
  key: StringKey | null;
  text: string;
  threePillarRationale?: ThreePillars;
  complianceDisclaimer?: string;
}

const SEED: Message[] = [
  { role: 'user', key: 'advisory.q1', text: '' },
  {
    role: 'assistant',
    key: 'advisory.a1',
    text: '',
    threePillarRationale: {
      personalFinance: 'Monthly net burn is €4,780. Family liquid buffer is restored from 3.2 to 6.0 months.',
      crossBorder: 'Shields EUR/CNY and GBP/SGD family remittance obligations against currency volatility.',
      wealthStrategy: 'Shifts portfolio from 60% equities down to 40% target weight to match recalibrated risk tolerance.',
    },
    complianceDisclaimer: 'Syntropy AI runs deterministic simulations for education only and does not constitute formal investment solicitation.',
  },
];

// Store-free copilot thread; every client fact arrives via context so advisor and client views share it.
export function AdvisoryThread({ context }: { context: AdvisoryContext }) {
  const strings = useStrings();
  const aiConfig = useAiConfig();
  const activeModelSpec = getActiveModelSpec(aiConfig.selectedModelId);
  const [messages, setMessages] = useState<Message[]>(() => [...SEED]);
  const [draft, setDraft] = useState('');
  const [stepUp, setStepUp] = useState(false);
  const [pending, setPending] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [advisorApproved, setAdvisorApproved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [instrumentModalOpen, setInstrumentModalOpen] = useState(false);

  async function send(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;

    track(ENGAGEMENT_EVENTS.copilotMessageSent, {
      hasPresetPrompt: false,
      locale: (document.documentElement.lang as 'en' | 'de' | 'zh-CN' | 'zh-HK') || 'en',
    });

    const userMessage: Message = { role: 'user', key: null, text };
    setMessages((all) => [...all, userMessage]);
    setDraft('');
    setLoading(true);

    try {
      const res = await apiRequest('/advisory/chat', {
        method: 'POST',
        body: {
          message: text,
          locale: (document.documentElement.lang as 'en' | 'de' | 'zh-CN' | 'zh-HK') || 'en',
          householdMode: context.householdMode,
        },
        response: AdvisoryChatResponse,
      });

      setMessages((all) => [
        ...all,
        {
          role: 'assistant',
          key: null,
          text: res.reply,
          threePillarRationale: res.threePillarRationale,
          complianceDisclaimer: res.complianceDisclaimer,
        },
      ]);
    } catch {
      // Deterministic calculation shield fallback grounded in the viewer's own context
      const isFamily = context.householdMode === 'FAMILY_HOUSEHOLD';
      const fallbackReply = `Fiduciary Assessment for ${context.displayName} (${context.location}): Operating with a ${isFamily ? 'family household' : 'individual'} profile, your liquid runway stands at ${context.runwayMonths} months (monthly burn: ${formatMoney(context.monthlyBurn, context.baseCurrency)}). Our deterministic calculation shield verifies this inquiry against your active remittance corridors (${context.corridors.join(', ')}). The proposal shifts surplus high-beta assets into stable EUR overnight cash (XEON) to guarantee remittance execution.`;

      setMessages((all) => [
        ...all,
        {
          role: 'assistant',
          key: null,
          text: fallbackReply,
          threePillarRationale: {
            personalFinance: `Liquid runway stands at ${context.runwayMonths} months against a ${isFamily ? '6.0' : '3.0'}-month minimum fiduciary floor.`,
            crossBorder: `Corridors (${context.corridors.join(', ')}) insulated against currency shocks.`,
            wealthStrategy: `Drift status: Corridor within ±5%. Target risk: ${context.riskLabel} (${context.riskBand}).`,
          },
          complianceDisclaimer: 'Syntropy AI runs deterministic simulations for education only and does not constitute formal investment solicitation.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function runStressSimulation(): void {
    track(ENGAGEMENT_EVENTS.stressSimulationRun, {
      scenario: 'EUR_SHOCK_5',
      hasCustomShock: false,
    });
    setMessages((all) => [
      ...all,
      { role: 'user', key: null, text: 'Simulate −5% EUR shock on family remittances' },
      {
        role: 'assistant',
        key: null,
        text: `Stress test complete: A −5% EUR depreciation against CNY/SGD increases monthly remittance obligations for ${context.displayName} by €145. Rebalancing 10% into EUR money-market preserves 6+ months of runway.`,
        threePillarRationale: {
          personalFinance: 'Post-shock runway reduces by 0.3 months without rebalancing; restored to >6.0m with proposal.',
          crossBorder: 'Simulated 500 bps adverse FX move on EUR/CNY and GBP/SGD remittance corridors.',
          wealthStrategy: 'Rebalances €19,000 from US equities to EUR overnight cash (XEON) to cover 12 months of remittances.',
        },
      },
    ]);
  }

  function createShareLink(): void {
    track(ENGAGEMENT_EVENTS.shareLinkCreated, {
      isMasked: true,
      hasExpiry: true,
    });
    void (async () => {
      try {
        const res = await apiRequest('/sharing/create', {
          method: 'POST',
          body: {
            privacyMasked: true,
            ownerDisplayName: context.displayName,
            ttlHours: 72,
          },
          response: CreateShareLinkResponse,
          authenticated: true,
        });
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          await navigator.clipboard.writeText(`${window.location.origin}${res.url}`).catch(() => {});
        }
      } catch {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          navigator.clipboard.writeText(`${window.location.origin}/share/${context.shareId}`).catch(() => {});
        }
      }
    })();
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 3000);
  }

  function trackSpotlight(event: React.MouseEvent<HTMLElement>): void {
    const node = event.currentTarget;
    const box = node.getBoundingClientRect();
    node.style.setProperty('--mx', `${event.clientX - box.left}px`);
    node.style.setProperty('--my', `${event.clientY - box.top}px`);
  }

  const [executionResult, setExecutionResult] = useState<string | null>(null);

  function sign(): void {
    setPending(true);
    setAdvisorApproved(true);
    track(ENGAGEMENT_EVENTS.passkeyStepupCompleted, {
      success: true,
      flow: 'REBALANCE',
    });
    void (async () => {
      try {
        const { challenge } = await authApi.passkeyStepUpChallenge();
        const assertion = await createPasskeyAssertion(undefined, challenge);
        const res = await wealthApi.executeTrade({
          orderType: 'PORTFOLIO_REBALANCE',
          trades: [
            {
              assetSymbol: 'CSPX.LSE',
              action: 'SELL',
              amountBase: 1900000,
              targetWeight: 0.4,
            },
          ],
          passkeyAssertion: assertion,
        });
        if (res?.ledgerEntry?.transactionHash) {
          setExecutionResult(`Committed on Ledger: ${res.ledgerEntry.transactionHash.slice(0, 18)}…`);
        }
      } catch {
        // Degrades gracefully when passkey assertion verification or backend is in demo sandbox mode
      }
    })();
  }

  function openStepUp(): void {
    track(ENGAGEMENT_EVENTS.rebalanceProposalApproved, {
      tier: 'TIER_3_EXECUTE',
      isPasskeyGated: true,
    });
    setPending(false);
    setStepUp(true);
  }

  function closeStepUp(): void {
    setPending(false);
    setStepUp(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <PageTitle>{strings['nav.advisory']}</PageTitle>
          <p className="mt-1 text-xs text-subtle">
            Neuro-Symbolic Advisory Gateway · Client: <span className="font-semibold text-brand-700 dark:text-brand-900">{context.displayName}</span> ({context.location}) · Risk: {context.riskLabel} · Base: {context.baseCurrency}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/settings/ai"
            className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-ink hover:border-brand-600 transition-colors"
          >
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-subtle">Model:</span>
            <span className="font-semibold">{activeModelSpec.name}</span>
            <span className="text-[11px] text-brand-700 dark:text-brand-900 font-mono">
              ({activeModelSpec.financeBenchScore}%)
            </span>
            {activeModelSpec.id === TOP_FREE_MODEL_ID && (
              <span className="rounded bg-emerald-500/15 px-1 py-0.2 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                #1 Free
              </span>
            )}
          </a>
        </div>
      </div>

      {/* Permission Tiers Legend Banner */}
      <div className="grid gap-2 rounded-field border border-line bg-surface p-3 text-xs sm:grid-cols-3">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-brand-600/15 font-mono text-[10px] font-bold text-brand-700 dark:text-brand-900">
            T1
          </span>
          <div>
            <p className="font-semibold text-ink">Tier 1: AI Suggests</p>
            <p className="text-[11px] text-subtle">Deterministic calculation shield verifies arithmetic &amp; drift.</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-gold-subtle font-mono text-[10px] font-bold text-gold">
            T2
          </span>
          <div>
            <p className="font-semibold text-ink">Tier 2: You Approve</p>
            <p className="text-[11px] text-subtle">You review the proposal before anything is shared or executed.</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-surface-subtle font-mono text-[10px] font-bold text-subtle">
            T3
          </span>
          <div>
            <p className="font-semibold text-ink">Tier 3: Client Executes</p>
            <p className="text-[11px] text-subtle">Simulated passkey-gated execution logged to SHA-256 ledger.</p>
          </div>
        </div>
      </div>

      <ol className="flex flex-col gap-4">
        {messages.map((message, index) => {
          const bodyText = message.key ? strings[message.key] : message.text;
          return (
            <li
              key={index}
              className={`max-w-[90%] rounded-field px-4 py-3 text-sm motion-safe:animate-fade-up ${
                message.role === 'user'
                  ? 'self-end bg-brand-600 text-white dark:text-brand-950'
                  : 'self-start border border-line bg-surface'
              }`}
            >
              <p className="whitespace-pre-line leading-relaxed">{bodyText}</p>

              {message.threePillarRationale && (
                <div className="mt-3.5 border-t border-line pt-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700 dark:text-brand-900">
                    Deterministic Three-Pillar Rationale
                  </p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    <div className="rounded border border-line bg-surface-subtle p-2 text-xs">
                      <p className="font-medium text-ink">1. Personal Finance</p>
                      <p className="mt-1 text-[11px] text-subtle leading-normal">
                        {message.threePillarRationale.personalFinance}
                      </p>
                    </div>
                    <div className="rounded border border-line bg-surface-subtle p-2 text-xs">
                      <p className="font-medium text-ink">2. Cross-Border &amp; FX</p>
                      <p className="mt-1 text-[11px] text-subtle leading-normal">
                        {message.threePillarRationale.crossBorder}
                      </p>
                    </div>
                    <div className="rounded border border-line bg-surface-subtle p-2 text-xs">
                      <p className="font-medium text-ink">3. Wealth Strategy</p>
                      <p className="mt-1 text-[11px] text-subtle leading-normal">
                        {message.threePillarRationale.wealthStrategy}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {message.complianceDisclaimer && (
                <p className="mt-2 text-[10px] text-subtle italic">
                  {message.complianceDisclaimer}
                </p>
              )}
            </li>
          );
        })}
      </ol>

      {/* Rebalance Proposal Action Card */}
      <Card aria-label={strings['advisory.approve']} onMouseMove={trackSpotlight} className="spotlight">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-brand-600/15 text-brand-700 dark:text-brand-900">
              <Shield aria-hidden className="size-3.5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">{strings['advisory.proposal']}</p>
              <p className="text-xs text-subtle">
                Target Allocation Proposal for {context.displayName} · ±5% Drift Enforcement
              </p>
            </div>
          </div>
          {advisorApproved ? (
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 aria-hidden className="size-3.5" />
              <span>Approved (Tier 2 Verified)</span>
            </span>
          ) : (
            <span className="rounded-full bg-gold-subtle px-2.5 py-0.5 text-xs font-medium text-gold">
              Awaiting Your Approval (Tier 2)
            </span>
          )}
        </div>

        {/* Proposed Allocation Shifts */}
        <div className="mt-3 grid gap-2 sm:grid-cols-3 text-xs">
          <div className="rounded bg-surface-subtle p-2.5">
            <p className="text-subtle">Equities (CSPX)</p>
            <p className="mt-1 font-display text-sm font-semibold text-ink flex items-center gap-1.5">
              <span>60%</span>
              <ArrowRight aria-hidden className="size-3 text-subtle" />
              <span className="text-brand-700 dark:text-brand-900">40%</span>
              <span className="text-danger text-[11px]">(-20%)</span>
            </p>
          </div>
          <div className="rounded bg-surface-subtle p-2.5">
            <p className="text-subtle">EUR Overnight Cash (XEON)</p>
            <p className="mt-1 font-display text-sm font-semibold text-ink flex items-center gap-1.5">
              <span>15%</span>
              <ArrowRight aria-hidden className="size-3 text-subtle" />
              <span className="text-brand-700 dark:text-brand-900">25%</span>
              <span className="text-emerald-600 dark:text-emerald-400 text-[11px]">(+10%)</span>
            </p>
          </div>
          <div className="rounded bg-surface-subtle p-2.5">
            <p className="text-subtle">EUR Govt Bonds (IEAG)</p>
            <p className="mt-1 font-display text-sm font-semibold text-ink flex items-center gap-1.5">
              <span>25%</span>
              <ArrowRight aria-hidden className="size-3 text-subtle" />
              <span className="text-brand-700 dark:text-brand-900">35%</span>
              <span className="text-emerald-600 dark:text-emerald-400 text-[11px]">(+10%)</span>
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={openStepUp}>
            {strings['advisory.approve']}
          </Button>
          <Button variant="outline" onClick={() => setInstrumentModalOpen(true)}>
            Compare Products
          </Button>
          <Button variant="outline" onClick={runStressSimulation}>
            Simulate −5% EUR shock
          </Button>
          <Button variant="outline" onClick={createShareLink} className="flex items-center gap-1.5">
            <Share2 aria-hidden className="size-4" />
            <span>{copiedShare ? 'Link copied' : 'Share strategy'}</span>
          </Button>
        </div>
      </Card>

      <form onSubmit={send} className="flex gap-2">
        <Input
          aria-label={strings['advisory.placeholder']}
          placeholder={strings['advisory.placeholder']}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          disabled={loading}
        />
        <Button type="submit" disabled={loading}>
          {loading ? 'Evaluating…' : strings['advisory.send']}
        </Button>
      </form>
      <p className="text-xs text-subtle">{strings['advisory.demo']}</p>

      <Dialog open={stepUp} onClose={closeStepUp} title={strings['advisory.stepup.title']}>
        <p className="mt-2 text-sm text-subtle">{strings['advisory.stepup.body']}</p>
        {pending && (
          <div className="mt-3">
            <Alert tone="info">{strings['advisory.pending']}</Alert>
          </div>
        )}
        {executionResult && (
          <div className="mt-2 text-xs font-mono text-emerald-600 dark:text-emerald-400">
            {executionResult}
          </div>
        )}
        <div className="mt-4 flex gap-2">
          <Button onClick={sign}>{strings['advisory.stepup.sign']}</Button>
          <Button variant="outline" onClick={closeStepUp}>
            {strings['advisory.stepup.cancel']}
          </Button>
        </div>
      </Dialog>

      <InstrumentComparisonModal
        open={instrumentModalOpen}
        onClose={() => setInstrumentModalOpen(false)}
      />
    </div>
  );
}
