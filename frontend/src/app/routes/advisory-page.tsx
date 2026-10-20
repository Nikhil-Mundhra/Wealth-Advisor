import { Navigate } from 'react-router';
import {
  DEFAULT_FAMILY_BURN_ESTIMATE,
  DEFAULT_INDIVIDUAL_BURN_ESTIMATE,
  listHoldingAmounts,
  type HouseholdMode,
} from '@wealth-advisor/rules';
import { MeGate } from '../../features/auth/components/me-gate.tsx';
import { useMe } from '../../features/auth/api/use-me.ts';
import { isDemoEmail, useProfile } from '../../features/profiling/profile-store.ts';
import { AdvisoryThread } from './advisory-thread.tsx';

// Client view: copilot context comes from the signed-in user's own portfolio, never the advisor roster.
export function ClientAdvisoryView() {
  const { data: me } = useMe();
  const profile = useProfile(me?.email);
  // shortcut: infer household from goals tag until the server profile carries a household field.
  const household: HouseholdMode = profile.answers.goals.tags.includes('FAMILY_SUPPORT')
    ? 'FAMILY_HOUSEHOLD'
    : 'INDIVIDUAL';

  if (!isDemoEmail(me?.email) && !profile.isCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  const liquidCash = listHoldingAmounts(profile.answers)
    .filter((holding) => holding.bucket === 'cashSavings')
    .reduce((total, holding) => total + holding.amount, 0);
  const monthlyBurn = household === 'INDIVIDUAL' ? DEFAULT_INDIVIDUAL_BURN_ESTIMATE : DEFAULT_FAMILY_BURN_ESTIMATE;

  return (
    <AdvisoryThread
      context={{
        displayName: me?.displayName || 'Private Client',
        location: profile.answers.countries.residence ?? '',
        riskLabel: `${profile.baseRiskScore}/10`,
        riskBand: profile.effectiveRiskBand,
        baseCurrency: profile.preferredCurrency,
        householdMode: household,
        runwayMonths: Math.round((liquidCash / monthlyBurn) * 10) / 10,
        monthlyBurn,
        corridors: profile.corridorCurrencies,
        shareId: `${me?.id ?? 'client'}_plan_2026`,
      }}
    />
  );
}

// /advisory serves the signed-in user's personal portfolio copilot; advisor roster copilot lives at /advisor/copilot.
export function AdvisoryPage() {
  return (
    <MeGate>
      <ClientAdvisoryView />
    </MeGate>
  );
}
