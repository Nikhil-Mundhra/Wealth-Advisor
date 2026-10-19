import { Navigate, createBrowserRouter } from 'react-router';
import { AdminRoute, GuestRoute, ProtectedRoute } from './route-guards.tsx';
import { AdminApiKeysPage } from './routes/admin-api-keys-page.tsx';
import { AdminModelsPage } from './routes/admin-models-page.tsx';
import { AdminPage } from './routes/admin-page.tsx';
import { AdminTenantsPage } from './routes/admin-tenants-page.tsx';
import { AdvisoryPage } from './routes/advisory-page.tsx';
import { CashflowPage } from './routes/cashflow-page.tsx';
import { DashboardPage } from './routes/dashboard-page.tsx';
import { HomePage } from './routes/home-page.tsx';
import { LoginPage } from './routes/login-page.tsx';
import { OnboardingPage } from './routes/onboarding-page.tsx';
import { PortfolioPage } from './routes/portfolio-page.tsx';
import { RootRoute } from './routes/root-route.tsx';
import { SecuritySettingsPage } from './routes/security-settings-page.tsx';
import { SettingsLedgerPage } from './routes/settings-ledger-page.tsx';
import { AiSettingsPage } from './routes/ai-settings-page.tsx';
import { RouteErrorBoundary } from './routes/route-error-boundary.tsx';
import { SharedPlanPage } from './routes/shared-plan-page.tsx';
import { SignupPage } from './routes/signup-page.tsx';
import { AppShell } from '../components/layout/app-shell.tsx';

export const router = createBrowserRouter([
  { path: '/home', element: <HomePage />, errorElement: <RouteErrorBoundary /> },
  {
    element: <GuestRoute />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: '/signup', element: <SignupPage /> },
      { path: '/login', element: <LoginPage /> },
    ],
  },
  // Root path: Anonymous visitors get HomePage; Authenticated users get AppShell with DashboardPage
  {
    path: '/',
    element: <RootRoute />,
    errorElement: <RouteErrorBoundary />,
    children: [{ index: true, element: <DashboardPage /> }],
  },
  {
    element: <ProtectedRoute />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: '/onboarding', element: <OnboardingPage /> },
      {
        element: <AppShell />,
        children: [
          { path: '/portfolio', element: <PortfolioPage /> },
          { path: '/cashflow', element: <CashflowPage /> },
          { path: '/advisory', element: <AdvisoryPage /> },
          { path: '/evidence', element: <Navigate to="/settings/ledger" replace /> },
          { path: '/settings', element: <Navigate to="/settings/security" replace /> },
          { path: '/settings/security', element: <SecuritySettingsPage /> },
          { path: '/settings/ledger', element: <SettingsLedgerPage /> },
          { path: '/settings/ai', element: <AiSettingsPage /> },
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
