import { LLM_PROVIDERS } from '@wealth-advisor/rules';
import { useStrings } from '../../lib/dictionaries.ts';

// Runtime provider switch; only the deterministic mock answers until the gateway lands.
export function AdminModelsPage() {
  const strings = useStrings();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">{strings['admin.models']}</h1>
      <ul className="flex flex-col gap-2 rounded-field border border-line bg-surface p-5 text-sm">
        {LLM_PROVIDERS.map((provider) => (
          <li key={provider} className="flex items-center justify-between gap-3">
            <span>{provider}</span>
            {provider === 'mock' && <span className="text-xs text-subtle">{strings['admin.active']}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
