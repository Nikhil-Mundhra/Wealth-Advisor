import { DEMO_LEDGER } from '../../lib/demo-data.ts';
import { useStrings } from '../../lib/dictionaries.ts';

// Tamper-evident sandbox executions with their audit digests.
export function EvidencePage() {
  const strings = useStrings();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">{strings['evidence.ledger']}</h1>
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
              <tr key={entry.digest} className="border-b border-line last:border-0">
                <th scope="row" className="px-4 py-3 text-left font-normal">
                  {entry.action}
                  <span className="block text-xs text-subtle">{entry.at}</span>
                </th>
                <td className="px-4 py-3">{entry.tier}</td>
                <td className="px-4 py-3 text-right font-mono text-xs">{entry.digest}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
