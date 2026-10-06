import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { setLocale } from '../../lib/locale-store.ts';
import { CashflowPage } from './cashflow-page.tsx';

let client: QueryClient;

describe('CashflowPage', () => {
  beforeEach(() => {
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    setLocale('en');
  });

  it('lists multi-currency accounts and the remittance plan', () => {
    render(
      <QueryClientProvider client={client}>
        <CashflowPage />
      </QueryClientProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Cash Flow' })).toBeVisible();
    expect(screen.getByText('EU Current')).toBeVisible();
    expect(screen.getByText('EUR → CNY')).toBeVisible();
    expect(screen.getByText('¥25,000')).toBeVisible();
  });
});
