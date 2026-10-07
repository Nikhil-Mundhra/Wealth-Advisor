import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';
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

  it('renders onboarding header and step 1 of questionnaire', async () => {
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <OnboardingPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Welcome to Wealth Advisor' })).toBeVisible();
    expect(screen.getByText('Question 1 of 7')).toBeVisible();
    expect(screen.getByText('How do you feel about investment risk?')).toBeVisible();

    await userEvent.click(screen.getByRole('button', { name: 'Accept normal market ups and downs for steady growth' }));
    const nextButton = screen.getByRole('button', { name: 'Next' });
    await userEvent.click(nextButton);

    expect(screen.getByText('Question 2 of 7')).toBeVisible();
  });
});
