import type { ConstructPortfolioResponse, RiskTierEnum } from '@wealth-advisor/contracts';
import { CheckCircle2 } from 'lucide-react';
import { useStrings } from '../../../../lib/dictionaries.ts';

function complianceRows(result: ConstructPortfolioResponse, riskTier: RiskTierEnum, shariaOnly: boolean, strings: ReturnType<typeof useStrings>) {
  const checks = result.complianceChecks;
  return [
    {
      title: strings['portfolio.construction.compliance.shariaTitle'],
      passed: checks.shariaPassed,
      body: shariaOnly
        ? strings['portfolio.construction.compliance.sharia.strict']
        : strings['portfolio.construction.compliance.sharia.dual'],
    },
    {
      title: strings['portfolio.construction.compliance.fundHouseTitle'],
      passed: checks.fundHouseCapPassed,
      body: strings['portfolio.construction.compliance.fundHouseBody'],
    },
    {
      title: strings['portfolio.construction.compliance.liquidityTitle'],
      passed: checks.liquidityPassed,
      body: strings['portfolio.construction.compliance.liquidityBody'],
    },
    {
      title: strings['portfolio.construction.compliance.durationTitle'].replace('{riskTier}', riskTier.toUpperCase()),
      passed: checks.durationCapPassed,
      body: strings['portfolio.construction.compliance.durationBody'].replace('{duration}', result.durationWeightedExposure.toFixed(1)),
    },
    {
      title: strings['portfolio.construction.compliance.sectorTitle'],
      passed: checks.sectorCapsPassed,
      body: strings['portfolio.construction.compliance.sectorBody'],
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
  const strings = useStrings();

  return (
    <div className="rounded-field border border-line bg-surface p-4 flex flex-col gap-3">
      <h3 className="text-xs font-bold uppercase tracking-wider text-subtle mb-1">
        {strings['portfolio.construction.compliance.matrixTitle']}
      </h3>

      <div className="space-y-2.5">
        {complianceRows(result, riskTier, shariaOnly, strings).map(({ title, body, passed }) => (
          <ComplianceRow key={title} title={title} body={body} passed={passed} />
        ))}
      </div>
    </div>
  );
}
