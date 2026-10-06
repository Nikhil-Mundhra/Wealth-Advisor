import { Card } from '../../../components/ui/card.tsx';
import { Button } from '../../../components/ui/button.tsx';
import { useStrings } from '../../../lib/dictionaries.ts';
import { useProfile } from '../profile-store.ts';

interface ProfileSummaryCardProps {
  onOpenQuestionnaire: () => void;
}

export function ProfileSummaryCard({ onOpenQuestionnaire }: ProfileSummaryCardProps) {
  const strings = useStrings();
  const profile = useProfile();

  return (
    <Card aria-label={strings['profiling.summary.title']} className="flex flex-col justify-between gap-3">
      <div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-subtle">{strings['profiling.summary.title']}</p>
          <span className="rounded-full bg-brand-600/10 px-2.5 py-0.5 text-xs font-semibold text-brand-700 dark:text-brand-900">
            {strings['profiling.badge.risk']} {profile.baseRiskScore} / 10
          </span>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-xs text-subtle">{strings['profiling.summary.horizon']}</span>
            <p className="font-medium">{profile.timeHorizonYears} {strings['dashboard.months'] ? 'yrs' : 'years'}</p>
          </div>
          <div>
            <span className="text-xs text-subtle">{strings['profiling.summary.corridors']}</span>
            <p className="font-medium truncate">{profile.corridorCurrencies.join(', ')}</p>
          </div>
        </div>
      </div>
      <Button
        variant="outline"
        onClick={onOpenQuestionnaire}
        className="w-full mt-1"
      >
        {strings['profiling.retake']}
      </Button>
    </Card>
  );
}
