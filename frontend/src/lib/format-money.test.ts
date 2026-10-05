import { describe, expect, it } from 'vitest';
import { setLocale } from './locale-store.ts';
import { formatMoney } from './format-money.ts';

describe('formatMoney', () => {
  it('renders the locale currency style', () => {
    setLocale('en');
    expect(formatMoney(95000, 'EUR')).toContain('€');
    setLocale('de');
    expect(formatMoney(95000, 'EUR')).toContain('€');
  });
});
