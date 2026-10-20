import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';
import { setLocale } from '../../lib/locale-store.ts';
import { SharedPlanPage } from './shared-plan-page.tsx';

function renderShare() {
  const router = createMemoryRouter([{ path: '/share/:token', element: <SharedPlanPage /> }], { initialEntries: ['/share/plan_abc123'] });
  render(<RouterProvider router={router} />);
}

describe('SharedPlanPage', () => {
  it('masks absolute amounts until the viewer opts in', async () => {
    setLocale('en');
    renderShare();

    expect(screen.getByText('/share/plan_abc123')).toBeVisible();
    expect(screen.queryByText('€57,000')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Show amounts' }));
    expect(screen.getByText('€57,000')).toBeVisible();
  });

  it('shows the stress simulation when the live plan is unavailable', async () => {
    setLocale('en');
    renderShare();

    expect(await screen.findByText('Live plan unavailable. Showing the demo allocation baseline.')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Stress Simulation (−5% EUR Shock)' })).toBeVisible();
    expect(screen.getByText(/Deterministic illustration/)).toBeVisible();
  });
});
