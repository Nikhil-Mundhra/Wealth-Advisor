import { useState } from 'react';
import { useParams } from 'react-router';
import { Button } from '../../components/ui/button.tsx';
import { Card } from '../../components/ui/card.tsx';
import { PageTitle } from '../../components/ui/page-title.tsx';
import { CLASS_CHART } from '../../lib/chart-colors.ts';
import { DEMO_BASELINE, DEMO_HOLDINGS } from '../../lib/demo-data.ts';
import { useStrings } from '../../lib/dictionaries.ts';
import { formatMoney } from '../../lib/format-money.ts';

// Public read-only strategy view; the token resolves server-side once the sharing module lands.
export function SharedPlanPage() {
  const { token } = useParams();
  const strings = useStrings();
  const [masked, setMasked] = useState(true);
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <p className="truncate text-xs text-subtle">/share/{token}</p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageTitle>{strings['dashboard.allocation']}</PageTitle>
        <Button variant="outline" aria-pressed={!masked} onClick={() => setMasked((was) => !was)}>
          {masked ? strings['share.amounts'] : strings['share.masked']}
        </Button>
      </div>
      <Card aria-label={strings['dashboard.allocation']}>
        <ul className="flex flex-col gap-4">
          {DEMO_HOLDINGS.map((holding) => (
            <li key={holding.assetClass}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <p>{holding.label}</p>
                <p className="font-medium">{masked ? `${holding.weight}%` : formatMoney(holding.valueEur, DEMO_BASELINE)}</p>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-subtle">
                <div className={`h-full rounded-full ${CLASS_CHART[holding.assetClass]}`} style={{ width: `${holding.weight}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </main>
  );
}
