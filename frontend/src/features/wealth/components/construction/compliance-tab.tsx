import type { ConstructPortfolioResponse, RiskTierEnum } from '@wealth-advisor/contracts';
import { CheckCircle2 } from 'lucide-react';

function complianceRows(result: ConstructPortfolioResponse, riskTier: RiskTierEnum, shariaOnly: boolean) {
  const checks = result.complianceChecks;
  return [
    {
      title: 'SCA / AAOIFI Sharia Compliance',
      passed: checks.shariaPassed,
      body: shariaOnly
        ? 'Strict filter verified: All portfolio holdings are certified Sharia-compliant sukuk or non-financial equities with compliant debt ratios.'
        : 'Dual-jurisdiction portfolio contains compliant sovereign sukuk alongside conventional diversification assets.',
    },
    {
      title: 'Fund House Concentration Cap (≤ 15%)',
      passed: checks.fundHouseCapPassed,
      body: 'No single asset management company or sponsor exceeds the 15% maximum portfolio concentration limit.',
    },
    {
      title: 'Minimum Liquidity Factor (≥ 0.70)',
      passed: checks.liquidityPassed,
      body: 'All allocated instruments possess verified daily trading volume meeting institutional liquidity criteria.',
    },
    {
      title: `Duration Risk Ceiling (${riskTier.toUpperCase()})`,
      passed: checks.durationCapPassed,
      body: `Duration-weighted bond exposure (${result.durationWeightedExposure} yrs) sits within the risk tier fiduciary ceiling.`,
    },
    {
      title: 'Single Sector Exposure Limit (≤ 30%)',
      passed: checks.sectorCapsPassed,
      body: 'No single macroeconomic industry sector exceeds 30% of total equity and credit exposure.',
    },
  ] as const;
}

function ComplianceRow({ title, body, passed }: { title: string; body: string; passed: boolean }) {
  return (
    <div className="flex items-start gap-3 p-2.5 rounded bg-surface-subtle">
      <CheckCircle2 className={`size-4 mt-0.5 ${passed ? 'text-emerald-600' : 'text-danger'}`} />
      <div className="text-xs">
        <span className="font-semibold text-ink block">{title}</span>
        <span className="text-subtle">{body}</span>
      </div>
    </div>
  );
}

export function ComplianceTab({
  result,
  riskTier,
  shariaOnly,
}: {
  result: ConstructPortfolioResponse;
  riskTier: RiskTierEnum;
  shariaOnly: boolean;
}) {
  return (
    <div className="rounded-field border border-line bg-surface p-4 flex flex-col gap-3">
      <h3 className="text-xs font-bold uppercase tracking-wider text-subtle mb-1">
        Fiduciary & Jurisdiction Rule Verification Matrix
      </h3>

      <div className="space-y-2.5">
        {complianceRows(result, riskTier, shariaOnly).map(({ title, body, passed }) => (
          <ComplianceRow key={title} title={title} body={body} passed={passed} />
        ))}
      </div>
    </div>
  );
}
