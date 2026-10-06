import { Navigate, createBrowserRouter } from 'react-router';
import { AdminRoute, GuestRoute, ProtectedRoute } from './route-guards.tsx';
import { AdminApiKeysPage } from './routes/admin-api-keys-page.tsx';
import { AdminModelsPage } from './routes/admin-models-page.tsx';
import { AdminPage } from './routes/admin-page.tsx';
import { AdminTenantsPage } from './routes/admin-tenants-page.tsx';
import { AdvisoryPage } from './routes/advisory-page.tsx';
import { CashflowPage } from './routes/cashflow-page.tsx';
import { DashboardPage } from './routes/dashboard-page.tsx';
import { EvidencePage } from './routes/evidence-page.tsx';
import { LoginPage } from './routes/login-page.tsx';
import { OnboardingPage } from './routes/onboarding-page.tsx';
import { PortfolioPage } from './routes/portfolio-page.tsx';
import { SecuritySettingsPage } from './routes/security-settings-page.tsx';
import { SharedPlanPage } from './routes/shared-plan-page.tsx';
import { SignupPage } from './routes/signup-page.tsx';
import { AppShell } from '../components/layout/app-shell.tsx';

export const router = createBrowserRouter([
  {
    element: <GuestRoute />,
    children: [
      { path: '/signup', element: <SignupPage /> },
      { path: '/login', element: <LoginPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/onboarding', element: <OnboardingPage /> },
      {
        element: <AppShell />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/portfolio', element: <PortfolioPage /> },
          { path: '/cashflow', element: <CashflowPage /> },
          { path: '/advisory', element: <AdvisoryPage /> },
          { path: '/evidence', element: <EvidencePage /> },
          { path: '/settings/security', element: <SecuritySettingsPage /> },
          {
            element: <AdminRoute />,
            children: [
              { path: '/admin', element: <AdminPage /> },
              { path: '/admin/tenants', element: <AdminTenantsPage /> },
              { path: '/admin/api-keys', element: <AdminApiKeysPage /> },
              { path: '/admin/models', element: <AdminModelsPage /> },
            ],
          },
        ],
      },
    ],
  },
  // Read-only shared plans need no account.
  { path: '/share/:token', element: <SharedPlanPage /> },
  { path: '*', element: <Navigate to="/" replace /> },
]);
