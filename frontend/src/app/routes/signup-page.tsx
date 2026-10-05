import { useNavigate } from 'react-router';
import { SplitLayout } from '../../components/layout/split-layout.tsx';
import { AuthHeader } from '../../features/auth/components/auth-header.tsx';
import { AuthSwitchLink } from '../../features/auth/components/auth-switch-link.tsx';
import { SignupForm } from '../../features/auth/components/signup-form.tsx';
import { HighlightPanel } from '../../features/marketing/components/highlight-panel.tsx';

export function SignupPage() {
  const navigate = useNavigate();
  return (
    <SplitLayout aside={<HighlightPanel />}>
      <AuthHeader title="Create your account" subtitle="Manage your money across borders." />
      <SignupForm onSuccess={(outcome) => navigate(outcome === 'signed-in' ? '/' : '/login?created=1', { replace: true })} />
      <AuthSwitchLink prompt="Already have an account?" to="/login" label="Sign in" />
    </SplitLayout>
  );
}
