import { Briefcase, Building2, Check, Scale, Shield, Sparkles, User, Users } from 'lucide-react';
import { useState } from 'react';

export function PositioningMatrixSection() {
  const [selectedWedge, setSelectedWedge] = useState<'b2b2c' | 'b2c'>('b2b2c');

  return (
    <section id="positioning" className="py-20 sm:py-28 bg-surface">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-control border border-gold/30 bg-gold-subtle px-3 py-1 text-xs font-bold uppercase tracking-wider text-gold">
            <Scale className="size-3.5" />
            <span>Pillar 1 · Strategic Positioning</span>
          </div>

          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl lg:text-5xl">
            Choose Your Wedge: <br />
            <span className="text-brand-700 dark:text-brand-600">B2B2C Co-Pilot vs. Direct B2C Autonomous</span>
          </h2>

          <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
            Wealth management requires razor-sharp go-to-market focus. Our architecture is designed to support
            either institutional deployment model while maintaining institutional compliance.
          </p>
        </div>

        {/* Wedge Comparison Cards */}
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {/* B2B2C Card */}
          <div
            className={`rounded-card border p-6 sm:p-8 transition-colors ${
              selectedWedge === 'b2b2c'
                ? 'border-brand-600 bg-surface shadow-xs'
                : 'border-line bg-surface-subtle'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-control bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-600">
                  <Building2 className="size-5" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-ink">B2B2C Advisor Co-Pilot</h3>
                  <p className="text-xs text-subtle">Institutional Practice & RIA Enablement</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedWedge('b2b2c')}
                className={`rounded-control px-3 py-1 text-xs font-semibold cursor-pointer ${
                  selectedWedge === 'b2b2c'
                    ? 'bg-brand-600 text-white dark:text-brand-950'
                    : 'bg-surface border border-line text-subtle hover:text-ink'
                }`}
              >
                {selectedWedge === 'b2b2c' ? 'Selected' : 'Select'}
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-subtle">Core Value Proposition</p>
                <p className="mt-1 text-sm font-semibold text-ink">
                  Saves 10+ hrs/week per advisor; eliminates administrative drag & surfaces proactive cross-sell and retention signals.
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-subtle">Primary Moats</p>
                <p className="mt-1 text-sm text-muted">
                  Deep two-way CRM and planning integrations (Wealthbox, eMoney, Redtail, Orion, Salesforce FSC) and enterprise compliance guardrails.
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-subtle">Regulatory Burden & Fiduciary Liability</p>
                <div className="mt-1 flex items-center gap-2 text-sm font-medium text-ink">
                  <Shield className="size-4 shrink-0 text-brand-600" />
                  <span>Lower: Human advisor remains the licensed fiduciary; AI acts as supervised execution co-pilot.</span>
                </div>
              </div>

              <div className="border-t border-line pt-4 text-xs text-subtle space-y-2">
                <div className="flex items-center gap-2">
                  <Check className="size-4 text-brand-600 shrink-0" />
                  <span>Rapid sales cycle with independent RIAs and broker-dealers</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="size-4 text-brand-600 shrink-0" />
                  <span>Configurable audio/transcript/summary compliance recording</span>
                </div>
              </div>
            </div>
          </div>

          {/* B2C Card */}
          <div
            className={`rounded-card border p-6 sm:p-8 transition-colors ${
              selectedWedge === 'b2c'
                ? 'border-brand-600 bg-surface shadow-xs'
                : 'border-line bg-surface-subtle'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-gold-subtle text-gold">
                  <User className="size-5" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-ink">B2C Direct Wealth Advisor</h3>
                  <p className="text-xs text-subtle">Next-Generation Autonomous Robo + LLM</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedWedge('b2c')}
                className={`rounded-control px-3 py-1 text-xs font-semibold cursor-pointer ${
                  selectedWedge === 'b2c'
                    ? 'bg-brand-600 text-white dark:text-brand-950'
                    : 'bg-surface border border-line text-subtle hover:text-ink'
                }`}
              >
                {selectedWedge === 'b2c' ? 'Selected' : 'Select'}
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-subtle">Core Value Proposition</p>
                <p className="mt-1 text-sm font-semibold text-ink">
                  Democratizes holistic life-cycle financial planning at a fraction of human advisory fees (0.25% vs 1.00% AUM).
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-subtle">Primary Moats</p>
                <p className="mt-1 text-sm text-muted">
                  Automated "Academic Prompt" translation, deterministic tax-loss harvesting, direct Open Banking aggregation, and frictionless onboarding.
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-subtle">Regulatory Burden & Fiduciary Liability</p>
                <div className="mt-1 flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400">
                  <Shield className="size-4 shrink-0" />
                  <span>High: Requires Registered Investment Advisor (RIA) registration, SEC/FINRA oversight, and algorithm fiduciary audits.</span>
                </div>
              </div>

              <div className="border-t border-line pt-4 text-xs text-subtle space-y-2">
                <div className="flex items-center gap-2">
                  <Check className="size-4 text-brand-600 shrink-0" />
                  <span>Direct-to-consumer scale across millions of mass affluent savers</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="size-4 text-brand-600 shrink-0" />
                  <span>Biometric step-up execution for automated rebalancing</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
