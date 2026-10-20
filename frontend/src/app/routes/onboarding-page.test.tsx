import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, MemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearDraft } from '../../features/profiling/profile-store.ts';
import { setLocale } from '../../lib/locale-store.ts';
import { OnboardingPage } from './onboarding-page.tsx';

let client: QueryClient;

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
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <OnboardingPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Welcome to Syntropy AI' })).toBeVisible();
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
});
