import { CheckCircle2, Cpu, GitBranch, Layers, ShieldAlert, Terminal } from 'lucide-react';

const PYRAMID_LAYERS = [
  {
    layer: 'L0',
    tier: 'Static, Docs, Deps & Types',
    scope: 'Strict TypeScript (tsc --noEmit), acyclic backend module DAG, 100% doc/file map parity, and npm audit.',
    tooling: 'make lint',
    budget: '< 10s',
  },
  {
    layer: 'L1',
    tier: 'Isolated Unit & State Machine',
    scope: 'Bond YTM/duration, DCF/WACC, burn-rate runway, WebAuthn ECDSA P-256 ceremony, calculation shield, and React 19 UI.',
    tooling: 'make test-unit / make test-ui',
    budget: '< 5s',
  },
  {
    layer: 'L1.5',
    tier: 'Property-Based Invariant Fuzzing',
    scope: '260+ seeded random tuples enforcing MVO simplex, AAOIFI Sharia exclusion, risk monotonicity, self-financing BUY <= SELL, shield, and rational FX.',
    tooling: 'make test-property',
    budget: '< 0.5s',
  },
  {
    layer: 'L2',
    tier: 'Cross-Workspace Contract Parity',
    scope: 'Zero drift across rules, contracts, backend error catalog, frontend validation keys, and MongoDB collection validators.',
    tooling: 'make test-contracts',
    budget: '< 3s',
  },
  {
    layer: 'L3 & L4',
    tier: 'Live Cross-Module E2E & P99 SLA Gate',
    scope: 'Full HTTP/WebAuthn orchestration (auth -> cashflow -> optimize -> advisory -> sharing -> Tier 3 gate) + 45-run P99 benchmarks.',
    tooling: 'make test-sla / make test-e2e',
    budget: '< 3s',
  },
];

const LATENCY_RATCHETS = [
  {
    stage: 'Stage A · Cashflow & FX Burn-Rate',
    sla: 'P99 < 25ms',
    baseline: '< 0.2ms P99 (48 runs)',
    guardrail: 'stage-latency-sla.memory.test.ts',
  },
  {
    stage: 'Stage B · 365-Day Covariance Snapshot',
    sla: 'P99 < 50ms',
    baseline: '< 0.5ms P99 (48 runs)',
    guardrail: 'stage-latency-sla.memory.test.ts',
  },
  {
    stage: 'Stage C · Constrained MVO & 2k Monte Carlo',
    sla: 'P99 < 120ms',
    baseline: '~2ms P99 (48 runs)',
    guardrail: 'stage-latency-sla.memory.test.ts',
  },
  {
    stage: 'Stage D · Calculation Shield & Copilot',
    sla: 'P99 < 150ms',
    baseline: '~2ms P99 (48 runs)',
    guardrail: 'stage-latency-sla.memory.test.ts',
  },
  {
    stage: 'Stage E · Full 5-Route HTTP E2E & Tier 3 Gate',
    sla: 'P99 < 400ms',
    baseline: '~18ms/iter E2E + WL_1004 gate',
    guardrail: 'stage-latency-sla.memory.test.ts',
  },
];

const COMMANDS = [
  { cmd: 'make ci', desc: 'Complete 3-stage pipeline locally (Lint -> Property/Contract/SLA -> Suite -> Build)' },
  { cmd: 'make lint', desc: 'Stage 1: docs-lint, module-deps DAG, tsc --noEmit, and npm audit' },
  { cmd: 'make test-property', desc: 'L1.5 seeded property-based mathematical and regulatory invariant fuzzing' },
  { cmd: 'make test-contracts', desc: 'L2 cross-workspace schema, error catalog, and validation key parity' },
  { cmd: 'make test-sla', desc: 'L3/L4 45-iteration P99 stage latency benchmark gates (<400ms SLA)' },
];

export function TestingGuardrailsSection() {
  return (
    <div className="space-y-8 p-4 sm:p-6">
      <div className="flex flex-col gap-2">
        <div className="inline-flex w-fit items-center gap-2 rounded-control border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
          <ShieldAlert className="size-3.5" />
          <span>Neuro-Symbolic CI/CD &amp; Formal Verification Guardrails</span>
        </div>
        <h3 className="font-display text-2xl font-semibold text-ink">
          5-Layer Testing Pyramid &amp; &lt;400ms P99 SLA Gates
        </h3>
        <p className="text-sm leading-relaxed text-muted max-w-3xl">
          Every commit runs through orthogonal granularity and execution pipelines protecting UCITS/SEBI caps,
          AAOIFI Sharia compliance, FIDO2 WebAuthn Tier 3 execution gates, and zero-hallucination arithmetic.
        </p>
      </div>

      {/* 5-Layer Testing Pyramid */}
      <div className="space-y-3">
        <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-subtle">
          <Layers className="size-4 text-brand-600" />
          <span>1. The Granularity Framework</span>
        </h4>
        <div className="overflow-x-auto rounded-card border border-line">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-subtle text-subtle border-b border-line">
              <tr>
                <th className="px-4 py-3 font-semibold">Layer</th>
                <th className="px-4 py-3 font-semibold">Tier</th>
                <th className="px-4 py-3 font-semibold">Target Scope &amp; Invariants Protected</th>
                <th className="px-4 py-3 font-semibold">Entrypoint</th>
                <th className="px-4 py-3 font-semibold text-right">Budget</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-surface">
              {PYRAMID_LAYERS.map((row) => (
                <tr key={row.layer} className="hover:bg-surface-subtle/50">
                  <td className="px-4 py-3 font-mono font-bold text-brand-700 dark:text-brand-400">{row.layer}</td>
                  <td className="px-4 py-3 font-semibold text-ink whitespace-nowrap">{row.tier}</td>
                  <td className="px-4 py-3 text-muted leading-relaxed">{row.scope}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-ink whitespace-nowrap">{row.tooling}</td>
                  <td className="px-4 py-3 font-mono text-right text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{row.budget}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enforced Latency Ratchets */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-subtle">
            <Cpu className="size-4 text-brand-600" />
            <span>2. Enforced 45-Run P99 Latency Ratchets</span>
          </h4>
          <div className="overflow-hidden rounded-card border border-line bg-surface">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-subtle border-b border-line">
                <tr>
                  <th className="px-3 py-2.5 font-semibold">Pipeline Stage</th>
                  <th className="px-3 py-2.5 font-semibold">SLA Gate</th>
                  <th className="px-3 py-2.5 font-semibold">Observed Baseline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {LATENCY_RATCHETS.map((item) => (
                  <tr key={item.stage}>
                    <td className="px-3 py-2.5 font-medium text-ink">{item.stage}</td>
                    <td className="px-3 py-2.5 font-mono font-semibold text-brand-700 dark:text-brand-400">{item.sla}</td>
                    <td className="px-3 py-2.5 font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="size-3 shrink-0" />
                      <span>{item.baseline}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-subtle">
            <GitBranch className="size-4 text-brand-600" />
            <span>3. CI/CD Pipeline DAG &amp; Commands</span>
          </h4>
          <div className="rounded-card border border-line bg-surface-subtle p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-ink">
              <span className="rounded bg-surface px-2 py-1 border border-line">Push / PR</span>
              <span>-&gt;</span>
              <span className="rounded bg-surface px-2 py-1 border border-line">Stage 1: Lint &amp; Types</span>
              <span>-&gt;</span>
              <span className="rounded bg-surface px-2 py-1 border border-line">Stage 2A/B/C Parallel</span>
              <span>-&gt;</span>
              <span className="rounded bg-surface px-2 py-1 border border-emerald-500/40 text-emerald-700 dark:text-emerald-400">
                Stage 3: E2E + &lt;400ms SLA
              </span>
            </div>
            <div className="space-y-1.5 pt-2 border-t border-line">
              {COMMANDS.map((entry) => (
                <div key={entry.cmd} className="flex items-start gap-2 text-xs">
                  <Terminal className="size-3.5 mt-0.5 shrink-0 text-subtle" />
                  <div>
                    <code className="font-mono font-semibold text-ink">{entry.cmd}</code>
                    <p className="text-[11px] text-subtle">{entry.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
