import { LLM_PROVIDERS } from '@wealth-advisor/rules';
import { cardClassName } from '../../components/ui/card.tsx';
import { PageTitle } from '../../components/ui/page-title.tsx';
import { cn } from '../../lib/cn.ts';
import { useStrings } from '../../lib/dictionaries.ts';

// Runtime provider switch; only the deterministic mock answers until the gateway lands.
export function AdminModelsPage() {
  const strings = useStrings();
  return (
    <div className="flex flex-col gap-6">
      <PageTitle>{strings['admin.models']}</PageTitle>
      <ul className={cn(cardClassName, 'flex flex-col gap-2 text-sm')}>
        {LLM_PROVIDERS.map((provider) => (
          <li key={provider} className="flex items-center justify-between gap-3">
            <span className="font-mono text-[13px]">{provider}</span>
            {provider === 'mock' && (
              <span className="rounded-full bg-gold-subtle px-2 py-0.5 text-xs font-medium text-gold">{strings['admin.active']}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
