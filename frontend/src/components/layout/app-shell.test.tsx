import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';
import { AppShell } from './app-shell.tsx';

function renderShell() {
  const router = createMemoryRouter(
    [{ element: <AppShell />, children: [{ path: '/', element: <p>Page body</p> }] }],
    { initialEntries: ['/'] },
  );
  render(<RouterProvider router={router} />);
}

describe('AppShell', () => {
  it('renders the page with sidebar and bottom-tab navigation to every core tab', () => {
    renderShell();
    expect(screen.getByText('Page body')).toBeVisible();
    // Sidebar and bottom tabs both link every tab.
    for (const name of ['Dashboard', 'Portfolio', 'Cash Flow', 'Advisory']) {
      expect(screen.getAllByRole('link', { name }).length).toBeGreaterThanOrEqual(2);
    }
    expect(screen.getByRole('link', { name: 'Settings' })).toBeVisible();
  });
});
