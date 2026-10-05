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
});
