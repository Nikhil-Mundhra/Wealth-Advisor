import { Navigate, createBrowserRouter } from 'react-router';
import { GuestRoute, ProtectedRoute } from './route-guards.tsx';
import { AdvisoryPage } from './routes/advisory-page.tsx';
import { CashflowPage } from './routes/cashflow-page.tsx';
import { DashboardPage } from './routes/dashboard-page.tsx';
import { LoginPage } from './routes/login-page.tsx';
import { PortfolioPage } from './routes/portfolio-page.tsx';
import { SecuritySettingsPage } from './routes/security-settings-page.tsx';
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
      {
        element: <AppShell />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/portfolio', element: <PortfolioPage /> },
          { path: '/cashflow', element: <CashflowPage /> },
          { path: '/advisory', element: <AdvisoryPage /> },
          { path: '/settings/security', element: <SecuritySettingsPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
