import { useNavigate, useSearchParams } from 'react-router';
import { UserCheck } from 'lucide-react';
import { SplitLayout } from '../../components/layout/split-layout.tsx';
import { AuthHeader } from '../../features/auth/components/auth-header.tsx';
import { AuthSwitchLink } from '../../features/auth/components/auth-switch-link.tsx';
import { SignupForm } from '../../features/auth/components/signup-form.tsx';
import { HighlightPanel } from '../../features/marketing/components/highlight-panel.tsx';

export function SignupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const advisorCode = searchParams.get('advisor') ?? undefined;

  return (
    <SplitLayout aside={<HighlightPanel />}>
      <AuthHeader title="Create your account" subtitle="Manage your money across borders." />
      {advisorCode && (
        <div className="mb-4 flex items-center gap-2 rounded-field bg-brand-500/10 p-3 text-xs text-brand-700 dark:text-brand-300 border border-brand-500/20">
          <UserCheck aria-hidden className="size-4 shrink-0 text-brand-600 dark:text-brand-400" />
          <span>
            You are joining via Wealth Analyst invitation (<strong className="font-mono">{advisorCode}</strong>). Your portfolio and profile will be connected to your advisor.
          </span>
        </div>
      )}
      <SignupForm
        initialAdvisorCode={advisorCode}
        onSuccess={(outcome) => navigate(outcome === 'signed-in' ? '/onboarding' : '/login?created=1', { replace: true })}
      />
      <AuthSwitchLink prompt="Already have an account?" to="/login" label="Sign in" />
    </SplitLayout>
  );
}
