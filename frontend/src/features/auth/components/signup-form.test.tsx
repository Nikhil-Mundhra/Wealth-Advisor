import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../../lib/api-error.ts';
import { authApi } from '../api/auth-api.ts';
import { SignupForm } from './signup-form.tsx';

vi.mock('../api/auth-api.ts', () => ({ authApi: { signup: vi.fn(), login: vi.fn() } }));

// One client per test, created outside render so re-renders keep the same cache.
let client: QueryClient;
const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;

async function fillAndSubmit(email: string, password: string) {
  await userEvent.type(screen.getByLabelText('Email address'), email);
  await userEvent.type(screen.getByLabelText('Password'), password);
  await userEvent.click(screen.getByRole('button', { name: 'Create account' }));
}

describe('SignupForm', () => {
  beforeEach(() => {
    client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    vi.mocked(authApi.signup).mockReset();
    vi.mocked(authApi.login).mockReset();
  });

  it('shows the contract messages on submit and calls nothing', async () => {
    render(<SignupForm onSuccess={vi.fn()} />, { wrapper });
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));
    expect(await screen.findByText('Enter your email address.')).toBeInTheDocument();
    expect(screen.getByText('Enter your password.')).toBeInTheDocument();
    expect(authApi.signup).not.toHaveBeenCalled();
  });

  it('checks the format and length with the shared rules', async () => {
    render(<SignupForm onSuccess={vi.fn()} />, { wrapper });
    await fillAndSubmit('june@example', 'short');
    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument();
    expect(screen.getByText('Use at least 8 characters.')).toBeInTheDocument();
    expect(authApi.signup).not.toHaveBeenCalled();
  });

  it('signs up, logs in with the same credentials, and reports success', async () => {
    vi.mocked(authApi.signup).mockResolvedValue({ userId: 'u1' });
    vi.mocked(authApi.login).mockResolvedValue({ accessToken: 'jwt', tokenType: 'Bearer', expiresIn: 900 });
    const onSuccess = vi.fn();
    render(<SignupForm onSuccess={onSuccess} />, { wrapper });
    await fillAndSubmit('june@example.com', 'correct-horse');
    await vi.waitFor(() => expect(onSuccess).toHaveBeenCalledWith('signed-in'));
    expect(authApi.login).toHaveBeenCalledWith({ email: 'june@example.com', password: 'correct-horse', clientType: 'WEB', rememberMe: false });
  });

  it('reports "created" when signup works but the follow-up login fails', async () => {
    vi.mocked(authApi.signup).mockResolvedValue({ userId: 'u1' });
    vi.mocked(authApi.login).mockRejectedValue(new ApiError(503, 'CORE_DB_UNCONFIGURED', 'down'));
    const onSuccess = vi.fn();
    render(<SignupForm onSuccess={onSuccess} />, { wrapper });
    await fillAndSubmit('june@example.com', 'correct-horse');
    await vi.waitFor(() => expect(onSuccess).toHaveBeenCalledWith('created'));
  });

  it('shows server field issues under their fields', async () => {
    vi.mocked(authApi.signup).mockRejectedValue(
      new ApiError(400, 'CORE_VALIDATION_FAILED', 'x', [{ path: ['password'], code: 'password.too_short' }]),
    );
    render(<SignupForm onSuccess={vi.fn()} />, { wrapper });
    await fillAndSubmit('june@example.com', 'correct-horse');
    expect(await screen.findByText('Use at least 8 characters.')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toHaveAttribute('aria-invalid', 'true');
  });

  it('puts a taken email under the email field', async () => {
    vi.mocked(authApi.signup).mockRejectedValue(new ApiError(409, 'AU_1001', 'taken'));
    render(<SignupForm onSuccess={vi.fn()} />, { wrapper });
    await fillAndSubmit('june@example.com', 'correct-horse');
    expect(await screen.findByText('An account with this email already exists.')).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toHaveAttribute('aria-invalid', 'true');
  });
});
