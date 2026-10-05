import type { AssetClass } from '@wealth-advisor/rules';
import { DEMO_BASELINE, DEMO_HOLDINGS, DEMO_TARGET_WEIGHTS } from '../../lib/demo-data.ts';
import { useStrings } from '../../lib/dictionaries.ts';
import { formatMoney } from '../../lib/format-money.ts';

const CLASSES = Object.keys(DEMO_TARGET_WEIGHTS) as AssetClass[];

// Every target class renders, even ones with no current holding, so the book always sums.
export function PortfolioPage() {
  const strings = useStrings();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">{strings['nav.portfolio']}</h1>
      <section aria-label={strings['portfolio.holdings']} className="overflow-hidden rounded-field border border-line bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-subtle">
              <th scope="col" className="px-4 py-3 font-medium">{strings['portfolio.holdings']}</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">{strings['portfolio.current']}</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">{strings['portfolio.target']}</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">{strings['portfolio.drift']}</th>
            </tr>
          </thead>
          <tbody>
            {CLASSES.map((assetClass) => {
              const holding = DEMO_HOLDINGS.find((candidate) => candidate.assetClass === assetClass);
              const current = holding?.weight ?? 0;
              const target = DEMO_TARGET_WEIGHTS[assetClass];
              const drift = target - current;
              return (
                <tr key={assetClass} className="border-b border-line last:border-0">
                  <th scope="row" className="px-4 py-3 text-left font-normal">
                    {holding?.label ?? assetClass}
                    {holding && <span className="block text-xs text-subtle">{formatMoney(holding.valueEur, DEMO_BASELINE)}</span>}
                  </th>
                  <td className="px-4 py-3 text-right">{current}%</td>
                  <td className="px-4 py-3 text-right">{target}%</td>
                  <td className="px-4 py-3 text-right">{drift > 0 ? `+${drift}` : drift}% {strings['portfolio.drift']}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
