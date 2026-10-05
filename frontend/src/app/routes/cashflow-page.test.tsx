import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { setLocale } from '../../lib/locale-store.ts';
import { CashflowPage } from './cashflow-page.tsx';

describe('CashflowPage', () => {
  it('lists multi-currency accounts and the remittance plan', () => {
    setLocale('en');
    render(<CashflowPage />);

    expect(screen.getByRole('heading', { name: 'Cash Flow' })).toBeVisible();
    expect(screen.getByText('EU Current')).toBeVisible();
    expect(screen.getByText('EUR → CNY')).toBeVisible();
    expect(screen.getByText('¥25,000')).toBeVisible();
  });
});
