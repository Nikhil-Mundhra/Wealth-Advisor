import { useNavigate } from 'react-router';
import { SplitLayout } from '../../components/layout/split-layout.tsx';
import { AuthHeader } from '../../features/auth/components/auth-header.tsx';
import { AuthSwitchLink } from '../../features/auth/components/auth-switch-link.tsx';
import { LoginForm } from '../../features/auth/components/login-form.tsx';
import { HighlightPanel } from '../../features/marketing/components/highlight-panel.tsx';

export function LoginPage() {
  const navigate = useNavigate();
  return (
    <SplitLayout aside={<HighlightPanel />}>
      <AuthHeader title="Welcome back" subtitle="Sign in to see your accounts and advice." />
      <LoginForm onSuccess={() => navigate('/', { replace: true })} />
      <AuthSwitchLink prompt="New here?" to="/signup" label="Create an account" />
    </SplitLayout>
  );
}
