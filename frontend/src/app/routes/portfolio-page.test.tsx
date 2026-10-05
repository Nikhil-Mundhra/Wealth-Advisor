import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { setLocale } from '../../lib/locale-store.ts';
import { PortfolioPage } from './portfolio-page.tsx';

describe('PortfolioPage', () => {
  it('lists holdings with current, target, and drift weights', () => {
    setLocale('en');
    render(<PortfolioPage />);

    expect(screen.getByRole('heading', { name: 'Portfolio' })).toBeVisible();
    expect(screen.getByRole('row', { name: /US Tech Equities/ })).toHaveTextContent('60%');
    // 40% target on 60% current: a -20pt drift into cash buffers.
    expect(screen.getByRole('row', { name: /US Tech Equities/ })).toHaveTextContent('-20%');
    // Unheld target classes still render so the book sums.
    expect(screen.getByRole('row', { name: /FX_HEDGE/ })).toHaveTextContent('+10%');
  });
});
