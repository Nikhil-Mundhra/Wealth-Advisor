import type { ConstructPortfolioResponse } from '@wealth-advisor/contracts';
import type { LucideIcon } from 'lucide-react';
import { Activity, FileText, Scale, ShieldCheck, TrendingUp } from 'lucide-react';
import { useStrings } from '../../../../lib/dictionaries.ts';

function rationalePillars(result: ConstructPortfolioResponse, strings: ReturnType<typeof useStrings>) {
  const { rationale } = result;
  return [
    { title: strings['portfolio.construction.rationale.pillar1'], icon: FileText, body: rationale.personalFinance },
    { title: strings['portfolio.construction.rationale.pillar2'], icon: FileText, body: rationale.crossBorder },
    { title: strings['portfolio.construction.rationale.pillar3'], icon: TrendingUp, body: rationale.wealthStrategy },
    { title: strings['portfolio.construction.rationale.pillar4'], icon: Activity, body: rationale.technicalAttribution },
    { title: strings['portfolio.construction.rationale.pillar5'], icon: Scale, body: rationale.fundamentalAttribution },
    { title: strings['portfolio.construction.rationale.pillar6'], icon: ShieldCheck, body: rationale.regulatoryAttribution },
  ] as const;
}

function RationalePillar({ title, icon: Icon, body }: { title: string; icon: LucideIcon; body: string }) {
  return (
    <div className="rounded-field border border-line bg-surface p-4 flex flex-col gap-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-700 dark:text-brand-400">
        <Icon className="size-3.5" />
        {title}
      </div>
      <p className="text-xs text-ink leading-relaxed">{body}</p>
    </div>
  );
}

export function RationaleTab({ result }: { result: ConstructPortfolioResponse }) {
  const strings = useStrings();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {rationalePillars(result, strings).map(({ title, icon, body }) => (
        <RationalePillar key={title} title={title} icon={icon} body={body} />
      ))}

      {/* Source Attributions */}
      <div className="md:col-span-2 rounded-field border border-line bg-surface-subtle p-3 text-xs">
        <span className="font-semibold text-subtle block mb-1">{strings['portfolio.construction.rationale.sourceAttribution']}</span>
        <ul className="list-disc list-inside space-y-0.5 text-muted text-[11px]">
          {result.sourceAttribution.map((src, i) => (
            <li key={i}>{src}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
