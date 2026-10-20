import type { ConstructPortfolioResponse } from '@wealth-advisor/contracts';
import { CheckCircle2 } from 'lucide-react';
import { formatMoney } from '../../../../lib/format-money.ts';

export function AllocationTab({ result, defaultCurrency }: { result: ConstructPortfolioResponse; defaultCurrency: string }) {
  return (
    <div className="overflow-x-auto rounded-field border border-line bg-surface">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-line bg-surface-subtle text-subtle">
          <tr>
            <th scope="col" className="px-3 py-2.5 font-semibold">Security & Ticker</th>
            <th scope="col" className="px-3 py-2.5 font-semibold">Asset Sleeve</th>
            <th scope="col" className="px-3 py-2.5 text-right font-semibold">Target Weight</th>
            <th scope="col" className="px-3 py-2.5 text-right font-semibold">Capital Allocation</th>
            <th scope="col" className="px-3 py-2.5 text-right font-semibold">Exp. Return</th>
            <th scope="col" className="px-3 py-2.5 text-right font-semibold">Volatility</th>
            <th scope="col" className="px-3 py-2.5 text-center font-semibold">Scores (T / F / Q)</th>
            <th scope="col" className="px-3 py-2.5 text-center font-semibold">Composite</th>
            <th scope="col" className="px-3 py-2.5 text-center font-semibold">Sharia Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {result.holdings.map((h) => (
            <tr key={h.symbol} className="hover:bg-surface-subtle/50 transition">
              <td className="px-3 py-3 font-medium">
                <span className="font-mono font-bold text-ink block">{h.symbol}</span>
                <span className="text-[11px] text-subtle block">{h.name}</span>
                <span className="text-[10px] text-muted block">{h.sector}</span>
              </td>
              <td className="px-3 py-3">
                <span className="rounded-control bg-surface-subtle border border-line px-2 py-0.5 text-[10px] font-medium text-ink">
                  {h.assetClass}
                </span>
              </td>
              <td className="px-3 py-3 text-right font-mono font-bold text-ink">
                {(h.weight * 100).toFixed(1)}%
              </td>
              <td className="px-3 py-3 text-right font-mono text-ink">
                {formatMoney(Math.round(h.targetAmountBase / 100), defaultCurrency as any)}
              </td>
              <td className="px-3 py-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                +{(h.expectedReturn * 100).toFixed(1)}%
              </td>
              <td className="px-3 py-3 text-right font-mono text-subtle">
                {(h.annualVolatility * 100).toFixed(1)}%
              </td>
              <td className="px-3 py-3 text-center font-mono text-[11px] text-subtle">
                <span title="Technical Score">{h.technicalScore.toFixed(2)}</span> /{' '}
                <span title="Fundamental Valuation Score">{h.fundamentalScore.toFixed(2)}</span> /{' '}
                <span title="Quality & Liquidity Score">{h.qualityScore.toFixed(2)}</span>
              </td>
              <td className="px-3 py-3 text-center">
                <span className="inline-block rounded-full bg-brand-500/10 px-2 py-0.5 font-mono text-[11px] font-bold text-brand-700 dark:text-brand-300">
                  {h.compositeScore.toFixed(2)}
                </span>
              </td>
              <td className="px-3 py-3 text-center">
                {h.isShariaCompliant ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="size-3 text-emerald-600" />
                    Sharia Certified
                  </span>
                ) : (
                  <span className="text-[10px] text-muted">Conventional</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
