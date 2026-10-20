import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, createMemoryRouter, RouterProvider } from 'react-router';
import { authApi } from '../../features/auth/api/auth-api.ts';
import { clearSession, getAccessToken, setAccessToken } from '../../features/auth/session/session-store.ts';
import { LoginForm } from '../../features/auth/components/login-form.tsx';
import { GuestRoute } from '../route-guards.tsx';
import { AdminLoginPage } from './admin-login-page.tsx';
import { AdvisorLoginPage } from './advisor-login-page.tsx';

vi.mock('../../features/auth/api/auth-api.ts', () => ({
  authApi: { login: vi.fn(), me: vi.fn(), logout: vi.fn() },
}));

let client: QueryClient;
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={client}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
);

function meAsUser() {
  return { id: 'u-1', email: 'user@example.com', displayName: null, roles: ['USER'], emailVerified: true, createdAt: '2026-01-01T00:00:00.000Z' };
}

function meAsStaff(roles: string[]) {
  return { id: 'a-1', email: 'advisor.morgan@syntropy.ch', displayName: null, roles, emailVerified: true, createdAt: '2026-01-01T00:00:00.000Z' };
}

async function submitClientForm(onSuccess: () => void) {
  render(<LoginForm onSuccess={onSuccess} />, { wrapper });
  await userEvent.type(screen.getByLabelText('Email address'), 'advisor.morgan@syntropy.ch');
  await userEvent.type(screen.getByLabelText('Password'), 'correct-horse-1');
  await userEvent.click(screen.getByRole('button', { name: 'Sign in', exact: true }));
}

async function submitAdvisorForm() {
  render(<AdvisorLoginPage />, { wrapper });
  await userEvent.type(screen.getByLabelText('Institutional email'), 'user@example.com');
  await userEvent.type(screen.getByLabelText('Password'), 'correct-horse-1');
  await userEvent.click(screen.getByRole('button', { name: 'Sign in to Workstation' }));
}

async function submitAdminForm() {
  render(<AdminLoginPage />, { wrapper });
  await userEvent.type(screen.getByLabelText('Operator email'), 'user@example.com');
  await userEvent.type(screen.getByLabelText('Password'), 'correct-horse-1');
  await userEvent.click(screen.getByRole('button', { name: 'Authenticate to Console' }));
}

function renderGuest(path: string) {
  setAccessToken('prior-token');
  const router = createMemoryRouter(
    [
      {
        element: <GuestRoute />,
        children: [
          { path: '/advisor/login', element: <p>Advisor Login</p> },
          { path: '/admin/login', element: <p>Admin Login</p> },
        ],
      },
      { path: '/', element: <p>Home</p> },
    ],
    { initialEntries: [path] },
  );
  render(
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe('role login mismatch keeps the existing session', () => {
  beforeEach(() => {
    client = new QueryClient({ defaultOptions: { mutations: { retry: false }, queries: { retry: false } } });
    vi.mocked(authApi.login).mockReset();
    vi.mocked(authApi.me).mockReset();
    vi.mocked(authApi.logout).mockReset();
    vi.mocked(authApi.login).mockResolvedValue({ accessToken: 'new-token', tokenType: 'Bearer', expiresIn: 900 });
    vi.mocked(authApi.me).mockResolvedValue(meAsUser());
    vi.mocked(authApi.logout).mockResolvedValue(undefined);
  });

  afterEach(() => {
    clearSession();
    vi.unstubAllGlobals();
  });

  it('advisor portal shows the role error without logging out a signed-in USER', async () => {
    setAccessToken('prior-token');
    await submitAdvisorForm();
    expect(await screen.findByText(/not authorized as an institutional Wealth Analyst/i)).toBeInTheDocument();
    expect(authApi.logout).not.toHaveBeenCalled();
    expect(getAccessToken()).not.toBeNull();
  });

  it('admin portal shows the role error without logging out a signed-in USER', async () => {
    setAccessToken('prior-token');
    await submitAdminForm();
    expect(await screen.findByText(/not authorized as a platform operator/i)).toBeInTheDocument();
    expect(authApi.logout).not.toHaveBeenCalled();
    expect(getAccessToken()).not.toBeNull();
  });

  it('anonymous role mismatch still ends the new session', async () => {
    clearSession();
    await submitAdvisorForm();
    expect(await screen.findByText(/not authorized as an institutional Wealth Analyst/i)).toBeInTheDocument();
    expect(authApi.logout).toHaveBeenCalledTimes(1);
    expect(getAccessToken()).toBeNull();
  });

  it('GuestRoute sends signed-in users away from the role portals', async () => {
    renderGuest('/advisor/login');
    expect(await screen.findByText('Home')).toBeVisible();
  });

  it('client login rejects advisor creds: stays signed out, shows the portal error, never navigates', async () => {
    clearSession();
    vi.mocked(authApi.me).mockResolvedValue(meAsStaff(['USER', 'ADVISOR']));
    const onSuccess = vi.fn();
    await submitClientForm(onSuccess);
    expect(await screen.findByText(/Wealth Analyst Workstation at \/advisor\/login/i)).toBeInTheDocument();
    expect(authApi.logout).toHaveBeenCalledTimes(1);
    expect(getAccessToken()).toBeNull();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('client login rejects admin creds and points at the operator console', async () => {
    clearSession();
    vi.mocked(authApi.me).mockResolvedValue(meAsStaff(['USER', 'ADMIN']));
    const onSuccess = vi.fn();
    await submitClientForm(onSuccess);
    expect(await screen.findByText(/Operator Console at \/admin\/login/i)).toBeInTheDocument();
    expect(authApi.logout).toHaveBeenCalledTimes(1);
    expect(getAccessToken()).toBeNull();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('client login signs in a pure USER and navigates', async () => {
    clearSession();
    vi.mocked(authApi.me).mockResolvedValue(meAsUser());
    const onSuccess = vi.fn();
    await submitClientForm(onSuccess);
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(authApi.logout).not.toHaveBeenCalled();
    expect(getAccessToken()).not.toBeNull();
  });
});
