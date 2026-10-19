import { useState } from 'react';
import { BookOpen, ChevronRight, Cpu, Layers, Network, Scale, ShieldCheck, Workflow } from 'lucide-react';
import { AdvisorLifecycleSection } from './advisor-lifecycle-section.tsx';
import { MITSloanShockSection } from './mit-sloan-shock-section.tsx';
import { KnowledgeGraphSection } from './knowledge-graph-section.tsx';
import { PositioningMatrixSection } from './positioning-matrix-section.tsx';
import { ComplianceSecuritySection } from './compliance-security-section.tsx';
import { ExecutionBlueprintSection } from './execution-blueprint-section.tsx';

export type DocSubtab = 'lifecycle' | 'mit-sloan' | 'knowledge-graph' | 'positioning' | 'compliance' | 'blueprint';

interface DocumentationSectionProps {
  activeSubtab?: DocSubtab;
  onSubtabChange?: (subtab: DocSubtab) => void;
}

const SUBTABS: { id: DocSubtab; label: string; icon: typeof Workflow; description: string }[] = [
  {
    id: 'lifecycle',
    label: 'Advisor Lifecycle OS',
    icon: Workflow,
    description: 'Workflow, pre/post meeting intelligence, CRM integrations, and human-in-the-loop lifecycle.',
  },
  {
    id: 'mit-sloan',
    label: 'MIT Sloan Rigor Gap',
    icon: Cpu,
    description: 'Income shocks, consumption smoothing, portfolio drift, and demographic bias elimination.',
  },
  {
    id: 'knowledge-graph',
    label: 'Semantic Knowledge Graph',
    icon: Network,
    description: 'Complex Event Processing (CEP), live client graph, and proactive next-best actions.',
  },
  {
    id: 'positioning',
    label: 'Strategic Wedge',
    icon: Scale,
    description: 'B2B2C Advisor Co-Pilot vs. B2C Direct Autonomous Wealth Advisor comparative matrix.',
  },
  {
    id: 'compliance',
    label: 'Compliance & Guardrails',
    icon: ShieldCheck,
    description: 'Deterministic calculation shield, immutable SHA-256 audit ledger, and zero training.',
  },
  {
    id: 'blueprint',
    label: 'Execution Blueprint',
    icon: Layers,
    description: '4-phase engineering roadmap from structured intake to synthetic persona eval suite.',
  },
];

export function DocumentationSection({ activeSubtab: controlledSubtab, onSubtabChange }: DocumentationSectionProps) {
  const [internalSubtab, setInternalSubtab] = useState<DocSubtab>('lifecycle');
  const currentSubtab = controlledSubtab ?? internalSubtab;

  const handleSelect = (id: DocSubtab) => {
    if (onSubtabChange) {
      onSubtabChange(id);
    } else {
      setInternalSubtab(id);
    }
  };

  return (
    <section id="documentation" className="py-16 sm:py-24 bg-surface border-y border-line">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-control border border-brand-600/20 bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-700 dark:bg-brand-950 dark:text-brand-600">
            <BookOpen className="size-3.5" />
            <span>Platform Documentation</span>
          </div>

          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl lg:text-5xl">
            Institutional Architecture Documentation
          </h2>

          <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
            Detailed technical breakdowns of our neuro-symbolic engine, lifecycle operating system,
            knowledge graph, and regulatory safeguards. Select a subtopic below to explore the specifications.
          </p>
        </div>

        {/* Subtabs Bar */}
        <div className="mt-10">
          <div
            role="tablist"
            aria-label="Documentation Subtabs"
            className="flex gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-line"
          >
            {SUBTABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentSubtab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`doc-panel-${tab.id}`}
                  onClick={() => handleSelect(tab.id)}
                  className={`group inline-flex shrink-0 items-center gap-2.5 rounded-t-lg border-b-2 px-4 py-3 text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'border-brand-600 bg-surface-subtle/70 text-ink shadow-xs'
                      : 'border-transparent text-subtle hover:border-line hover:text-ink hover:bg-surface-subtle/30'
                  }`}
                >
                  <Icon
                    className={`size-4 transition-colors ${
                      isActive ? 'text-brand-600 dark:text-brand-700' : 'text-subtle group-hover:text-ink'
                    }`}
                  />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Subtab Description Banner */}
          <div className="mt-3 flex items-center justify-between rounded-lg bg-surface-subtle/50 px-4 py-2 text-xs text-subtle">
            <span>{SUBTABS.find((t) => t.id === currentSubtab)?.description}</span>
            <span className="hidden sm:inline text-[11px] font-medium text-brand-700 dark:text-brand-600">
              Active Specification
            </span>
          </div>
        </div>

        {/* Subtab Panels */}
        <div className="mt-8">
          <div
            id={`doc-panel-${currentSubtab}`}
            role="tabpanel"
            aria-labelledby={`tab-${currentSubtab}`}
            className="rounded-2xl border border-line bg-surface p-2 sm:p-6 shadow-sm"
          >
            {currentSubtab === 'lifecycle' && <AdvisorLifecycleSection />}
            {currentSubtab === 'mit-sloan' && <MITSloanShockSection />}
            {currentSubtab === 'knowledge-graph' && <KnowledgeGraphSection />}
            {currentSubtab === 'positioning' && <PositioningMatrixSection />}
            {currentSubtab === 'compliance' && <ComplianceSecuritySection />}
            {currentSubtab === 'blueprint' && <ExecutionBlueprintSection />}
          </div>
        </div>
      </div>
    </section>
  );
}
