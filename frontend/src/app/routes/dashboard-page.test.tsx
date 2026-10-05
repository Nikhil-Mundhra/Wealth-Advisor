import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { setLocale } from '../../lib/locale-store.ts';
import { DashboardPage } from './dashboard-page.tsx';

describe('DashboardPage', () => {
  it('shows net worth, the runway gauge, and switches household mode', async () => {
    setLocale('en');
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    expect(screen.getByText(/95/)).toBeVisible();
    expect(screen.getByText(/3.2 months · Warning/)).toBeVisible();
    expect(screen.getByRole('img', { name: 'Net worth · 6 months' })).toBeVisible();
    expect(screen.getByRole('link', { name: /Proposed rebalance/ })).toBeVisible();

    await userEvent.click(screen.getByRole('button', { name: 'Individual' }));
    expect(screen.getByRole('button', { name: 'Individual' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Family household' })).toHaveAttribute('aria-pressed', 'false');
  });
});
