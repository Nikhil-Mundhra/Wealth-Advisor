import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';
import { setLocale } from '../../lib/locale-store.ts';
import { DashboardPage } from './dashboard-page.tsx';

let client: QueryClient;

describe('DashboardPage', () => {
  beforeEach(() => {
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    setLocale('en');
  });

  it('shows net worth, the runway gauge, and switches household mode', async () => {
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    expect(screen.getByText(/95/)).toBeVisible();
    expect(screen.getByText(/3.2 months · Warning/)).toBeVisible();
    expect(screen.getByRole('img', { name: 'Net worth · 6 months' })).toBeVisible();
    expect(screen.getByRole('link', { name: /Proposed rebalance/ })).toBeVisible();

    await userEvent.click(screen.getByRole('button', { name: 'Individual' }));
    expect(screen.getByRole('button', { name: 'Individual' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Family household' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText(/3 months · Individual/)).toBeVisible();

    const profileButton = screen.getByRole('button', { name: 'Edit profile' });
    expect(profileButton).toBeVisible();
    await userEvent.click(profileButton);
    expect(screen.getByRole('dialog')).toBeVisible();
    expect(screen.getByText('Investor profile')).toBeVisible();
  });
});
