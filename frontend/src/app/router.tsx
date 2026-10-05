import { Navigate, createBrowserRouter } from 'react-router';
import { GuestRoute, ProtectedRoute } from './route-guards.tsx';
import { HomePage } from './routes/home-page.tsx';
import { LoginPage } from './routes/login-page.tsx';
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
        children: [{ path: '/', element: <HomePage /> }],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
