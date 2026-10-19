import { Link, useNavigate, useSearchParams } from 'react-router';
import { Alert } from '../../components/ui/alert.tsx';
import { SplitLayout } from '../../components/layout/split-layout.tsx';
import { AuthHeader } from '../../features/auth/components/auth-header.tsx';
import { AuthSwitchLink } from '../../features/auth/components/auth-switch-link.tsx';
import { LoginForm } from '../../features/auth/components/login-form.tsx';
import { HighlightPanel } from '../../features/marketing/components/highlight-panel.tsx';

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  return (
    <SplitLayout aside={<HighlightPanel />}>
      <AuthHeader title="Welcome back" subtitle="Sign in to see your accounts and advice." />
      {searchParams.has('created') && <Alert tone="info">Account created. Please sign in.</Alert>}
      <LoginForm onSuccess={() => navigate('/', { replace: true })} />
      <AuthSwitchLink prompt="New here?" to="/signup" label="Create an account" />
      <div className="mt-4 border-t border-line/60 pt-4 text-center text-xs text-subtle">
        <span>Are you an institutional partner? </span>
        <Link to="/advisor/login" className="font-medium text-ink hover:underline">
          Wealth Analyst Workstation →
        </Link>
      </div>
    </SplitLayout>
  );
}

