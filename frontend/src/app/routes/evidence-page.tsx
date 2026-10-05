import { PageTitle } from '../../components/ui/page-title.tsx';
import { DEMO_LEDGER } from '../../lib/demo-data.ts';
import { useStrings } from '../../lib/dictionaries.ts';
import { useReveal } from '../../lib/use-reveal.ts';

// Tamper-evident sandbox executions with their audit digests.
export function EvidencePage() {
  const strings = useStrings();
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} className={`flex flex-col gap-6 motion-safe:transition-all motion-safe:duration-500 ${visible ? 'motion-safe:translate-y-0 motion-safe:opacity-100' : 'motion-safe:translate-y-3 motion-safe:opacity-0'}`}>
      <PageTitle>{strings['evidence.ledger']}</PageTitle>
      <section aria-label={strings['evidence.ledger']} className="overflow-hidden rounded-field border border-line bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-subtle">
              <th scope="col" className="px-4 py-3 font-medium">{strings['evidence.action']}</th>
              <th scope="col" className="px-4 py-3 font-medium">{strings['evidence.tier']}</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">{strings['evidence.digest']}</th>
            </tr>
          </thead>
          <tbody>
            {DEMO_LEDGER.map((entry) => (
              <tr key={entry.digest} className="border-b border-line transition-colors last:border-0 motion-safe:hover:bg-surface-subtle">
                <th scope="row" className="px-4 py-3 text-left font-normal">
                  {entry.action}
                  <span className="block text-xs text-subtle">{entry.at}</span>
                </th>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${entry.tier === 'TIER_3_EXECUTE' ? 'bg-gold-subtle text-gold' : 'bg-surface-subtle text-subtle'}`}>
                    {entry.tier}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs">{entry.digest}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
