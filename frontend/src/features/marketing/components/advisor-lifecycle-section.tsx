import { useState } from 'react';
import { CalendarCheck, CheckCircle2, Clock, FileSpreadsheet, FileText, MessageSquareQuote, ShieldCheck, Sparkles, UserCheck } from 'lucide-react';
import advisorMeetingImg from '../../../assets/advisor-meeting.jpg';

export function AdvisorLifecycleSection() {
  const [activeStage, setActiveStage] = useState<'pre' | 'in' | 'post'>('pre');

  return (
    <section id="workflow-jump" className="py-20 sm:py-28 bg-surface">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-control border border-brand-600/20 bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-700 dark:bg-brand-950 dark:text-brand-600">
            <Sparkles className="size-3.5" />
            <span>Advisor Workflow & Execution Layer</span>
          </div>

          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl lg:text-5xl">
            Advisors Don’t Want Another Chatbot. <br />
            <span className="text-brand-700 dark:text-brand-600">They Want an Operating System.</span>
          </h2>

          <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
            Generic conversational bots force advisors into double-entry purgatory. Syntropy AI embeds
            directly into your firm's existing custodial and planning infrastructure—automating
            the entire client meeting lifecycle with strict regulatory compliance and two-way CRM integration.
          </p>
        </div>

        {/* 16:9 Widescreen Image Showcase: Sits over the lifecycle workflow */}
        <div className="mt-10 overflow-hidden rounded-card border border-line bg-surface shadow-xs">
          <img
            src={advisorMeetingImg}
            alt="Advisor and client conducting an institutional wealth review in a panoramic modern office"
            loading="lazy"
            className="aspect-[16/9] w-full object-cover"
          />
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-surface-subtle px-4 py-3 sm:px-6">
            <div className="flex items-center gap-2.5">
              <span className="size-2 rounded-full bg-brand-600" />
              <p className="text-xs text-ink">
                <span className="font-semibold">Advisor Lifecycle Engine</span> · Real-time client review & automated pre-meeting briefing
              </p>
            </div>
            <span className="text-[11px] font-medium text-subtle">
              10.4 hrs saved / advisor / week
            </span>
          </div>
        </div>

        {/* Workflow Lifecycle Stages & Integrations: Below the Image */}
        <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:items-start">
          {/* Left: 3-Stage Interactive Selector & Details */}
          <div className="lg:col-span-8">
            <div className="flex rounded-control border border-line bg-surface-subtle p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveStage('pre')}
                className={`flex-1 rounded-control py-2.5 transition-all cursor-pointer ${
                  activeStage === 'pre'
                    ? 'bg-surface text-ink shadow-xs'
                    : 'text-subtle hover:text-ink'
                }`}
              >
                1. Pre-Meeting Prep
              </button>
              <button
                type="button"
                onClick={() => setActiveStage('in')}
                className={`flex-1 rounded-control py-2.5 transition-all cursor-pointer ${
                  activeStage === 'in'
                    ? 'bg-surface text-ink shadow-xs'
                    : 'text-subtle hover:text-ink'
                }`}
              >
                2. In-Meeting Intelligence
              </button>
              <button
                type="button"
                onClick={() => setActiveStage('post')}
                className={`flex-1 rounded-control py-2.5 transition-all cursor-pointer ${
                  activeStage === 'post'
                    ? 'bg-surface text-ink shadow-xs'
                    : 'text-subtle hover:text-ink'
                }`}
              >
                3. Post-Meeting CRM Sync
              </button>
            </div>

            {/* Stage Content Card */}
            <div className="mt-4 rounded-card border border-line bg-surface p-6 shadow-xs">
              {activeStage === 'pre' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-brand-700 dark:text-brand-600 font-semibold text-sm">
                    <CalendarCheck className="size-4" />
                    <span>Instant 30-Second Briefing Document</span>
                  </div>
                  <p className="text-sm leading-relaxed text-muted">
                    Synthesizes real-time portfolio drift, recent banking cashflows via Plaid, tax-loss
                    harvesting opportunities, and recent life events before the advisor joins the video call.
                  </p>
                  <ul className="text-xs text-subtle space-y-2 pt-2 border-t border-line/60">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="size-4 text-brand-600 shrink-0" />
                      <span>Highlights asset classes exceeding ±5% drift threshold</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="size-4 text-brand-600 shrink-0" />
                      <span>Identifies held-away cash drag sitting in low-yield checking accounts</span>
                    </li>
                  </ul>
                </div>
              )}

              {activeStage === 'in' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-brand-700 dark:text-brand-600 font-semibold text-sm">
                    <MessageSquareQuote className="size-4" />
                    <span>Live Meeting Notes & Compliance Guardrails</span>
                  </div>
                  <p className="text-sm leading-relaxed text-muted">
                    Captures real-time client sentiment, flags life events (marriage, home purchase, college tuition),
                    and surfaces compliance-approved talking points while blocking promissory return statements.
                  </p>
                  <ul className="text-xs text-subtle space-y-2 pt-2 border-t border-line/60">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="size-4 text-brand-600 shrink-0" />
                      <span>Configurable recording: audio-free transcript or encrypted summary</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="size-4 text-brand-600 shrink-0" />
                      <span>Real-time disclosure verification preventing regulatory infractions</span>
                    </li>
                  </ul>
                </div>
              )}

              {activeStage === 'post' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-brand-700 dark:text-brand-600 font-semibold text-sm">
                    <FileSpreadsheet className="size-4" />
                    <span>Two-Way CRM, Planning & Custodial Sync</span>
                  </div>
                  <p className="text-sm leading-relaxed text-muted">
                    One-click structured sync into Wealthbox, Redtail, eMoney, Orion, and Salesforce FSC. Auto-generates
                    customized client follow-up emails and queues proposed portfolio rebalances for human signoff.
                  </p>
                  <ul className="text-xs text-subtle space-y-2 pt-2 border-t border-line/60">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="size-4 text-brand-600 shrink-0" />
                      <span>Automated client task assignments & calendar scheduling</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="size-4 text-brand-600 shrink-0" />
                      <span>Stage trade tickets into custodial queue awaiting licensed signoff</span>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Right: Supported Integrations Card */}
          <div className="lg:col-span-4 rounded-card border border-line bg-surface-subtle p-6">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink">
                Two-Way Ecosystem Integrations
              </p>
              <span className="rounded bg-gold/15 px-2 py-0.5 text-[10px] font-semibold text-gold dark:text-gold-light border border-gold/30">
                Roadmap
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Direct API connectors with bi-directional sync to keep client records unified across platforms (Phase 2 roadmap).
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-ink">
              <span className="rounded-control border border-line bg-surface px-2.5 py-1">Wealthbox</span>
              <span className="rounded-control border border-line bg-surface px-2.5 py-1">Redtail CRM</span>
              <span className="rounded-control border border-line bg-surface px-2.5 py-1">eMoney</span>
              <span className="rounded-control border border-line bg-surface px-2.5 py-1">RightCapital</span>
              <span className="rounded-control border border-line bg-surface px-2.5 py-1">Salesforce FSC</span>
              <span className="rounded-control border border-line bg-surface px-2.5 py-1">Orion</span>
              <span className="rounded-control border border-line bg-surface px-2.5 py-1">Plaid Aggregation</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
