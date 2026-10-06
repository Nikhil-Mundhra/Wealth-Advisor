import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { setLocale } from '../../lib/locale-store.ts';
import { PortfolioPage } from './portfolio-page.tsx';

let client: QueryClient;

describe('PortfolioPage', () => {
  beforeEach(() => {
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    setLocale('en');
  });

  it('lists holdings with current, target, and drift weights', () => {
    render(
      <QueryClientProvider client={client}>
        <PortfolioPage />
      </QueryClientProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Portfolio' })).toBeVisible();
    expect(screen.getByRole('row', { name: /US Tech Equities/ })).toHaveTextContent('60%');
    // 40% target on 60% current: a -20pt drift into cash buffers.
    expect(screen.getByRole('row', { name: /US Tech Equities/ })).toHaveTextContent('-20%');
    // Unheld target classes still render so the book sums.
    expect(screen.getByRole('row', { name: /FX_HEDGE/ })).toHaveTextContent('+10%');
  });
});
