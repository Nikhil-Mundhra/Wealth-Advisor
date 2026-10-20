import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, MemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearDraft } from '../../features/profiling/profile-store.ts';
import { setLocale } from '../../lib/locale-store.ts';
import { OnboardingPage } from './onboarding-page.tsx';

let client: QueryClient;

function stubMe(roles: string[] = ['USER'], email = 'fresh@example.com') {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify({ id: 'u-1', email, displayName: null, roles, emailVerified: true, createdAt: '2026-01-01T00:00:00.000Z' }), { status: 200, headers: { 'content-type': 'application/json' } })),
  );
}

describe('OnboardingPage', () => {
  beforeEach(() => {
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    setLocale('en');
    clearDraft();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders onboarding header and step 1 of questionnaire', async () => {
    stubMe();
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <OnboardingPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByRole('heading', { name: 'Welcome to Syntropy AI' })).toBeVisible();
    expect(screen.getByText('Question 1 of 7')).toBeVisible();
    expect(screen.getByText('How do you feel about investment risk?')).toBeVisible();

    await userEvent.click(screen.getByRole('button', { name: 'Accept normal market ups and downs for steady growth' }));
    const nextButton = screen.getByRole('button', { name: 'Next' });
    await userEvent.click(nextButton);

    expect(screen.getByText('Question 2 of 7')).toBeVisible();
  });

  it('redirects ADVISOR accounts directly to the advisor workstation', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ id: 'a-1', email: 'advisor.morgan@syntropy.ch', displayName: 'Alex Morgan', roles: ['USER', 'ADVISOR'], emailVerified: true, createdAt: '2026-01-01T00:00:00.000Z' }), { status: 200, headers: { 'content-type': 'application/json' } })),
    );
    const router = createMemoryRouter(
      [
        { path: '/onboarding', element: <OnboardingPage /> },
        { path: '/advisor', element: <p>Advisor Workstation</p> },
      ],
      { initialEntries: ['/onboarding'] },
    );
    render(
      <QueryClientProvider client={client}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );

    expect(await screen.findByText('Advisor Workstation')).toBeVisible();
  });

  it('redirects ADMIN accounts directly to the admin console', async () => {
    stubMe(['USER', 'ADMIN'], 'admin@example.com');
    const router = createMemoryRouter(
      [
        { path: '/onboarding', element: <OnboardingPage /> },
        { path: '/admin', element: <p>Admin Console</p> },
      ],
      { initialEntries: ['/onboarding'] },
    );
    render(
      <QueryClientProvider client={client}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );

    expect(await screen.findByText('Admin Console')).toBeVisible();
  });

  it('shows a spinner instead of the questionnaire while roles resolve', async () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => {})));
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <OnboardingPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText('Loading')).toBeInTheDocument();
    expect(screen.queryByText('Question 1 of 7')).toBeNull();
  });
});
