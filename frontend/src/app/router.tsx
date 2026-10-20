import { Navigate, createBrowserRouter } from 'react-router';
import { AdminRoute, AdvisorRoute, GuestRoute, ProtectedRoute } from './route-guards.tsx';
import { AdminApiKeysPage } from './routes/admin-api-keys-page.tsx';
import { AdminCredentialsPage } from './routes/admin-credentials-page.tsx';
import { AdminLoginPage } from './routes/admin-login-page.tsx';
import { AdminModelsPage } from './routes/admin-models-page.tsx';
import { AdminPage } from './routes/admin-page.tsx';
import { AdminTenantsPage } from './routes/admin-tenants-page.tsx';
import { AdminUsersPage } from './routes/admin-users-page.tsx';
import { AdvisorLoginPage } from './routes/advisor-login-page.tsx';
import { AdvisorWorkstationPage } from './routes/advisor-workstation-page.tsx';
import { AdvisoryPage } from './routes/advisory-page.tsx';
import { CashflowPage } from './routes/cashflow-page.tsx';
import { DashboardPage } from './routes/dashboard-page.tsx';
import { EvidencePage } from './routes/evidence-page.tsx';
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
      { path: '/admin/login', element: <AdminLoginPage /> },
      { path: '/advisor/login', element: <AdvisorLoginPage /> },
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
          { path: '/evidence', element: <EvidencePage /> },
          { path: '/settings', element: <Navigate to="/settings/security" replace /> },
          { path: '/settings/security', element: <SecuritySettingsPage /> },
          { path: '/settings/ledger', element: <SettingsLedgerPage /> },
          { path: '/settings/ai', element: <AiSettingsPage /> },
          {
            element: <AdvisorRoute />,
            children: [
              { path: '/advisor', element: <AdvisorWorkstationPage /> },
              { path: '/advisor/client', element: <AdvisorWorkstationPage /> },
              { path: '/advisor/copilot', element: <AdvisorWorkstationPage /> },
              { path: '/advisor/instruments', element: <AdvisorWorkstationPage /> },
              { path: '/advisor/invites', element: <AdvisorWorkstationPage /> },
              { path: '/advisor/evidence', element: <EvidencePage /> },
              { path: '/advisor/settings', element: <SecuritySettingsPage /> },
            ],
          },
          {
            element: <AdminRoute />,
            children: [
              { path: '/admin', element: <AdminPage /> },
              { path: '/admin/users', element: <AdminUsersPage /> },
              { path: '/admin/credentials', element: <AdminCredentialsPage /> },
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
