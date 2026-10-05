import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { setTheme } from '../../lib/theme-store.ts';
import { ThemeToggle } from './theme-toggle.tsx';

describe('ThemeToggle', () => {
  it('flips the dark class on <html> and announces the next mode', async () => {
    setTheme('light');
    render(<ThemeToggle />);

    await userEvent.click(screen.getByRole('button', { name: 'Switch to dark mode' }));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeVisible();
  });
});
