import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { setLocale } from '../../lib/locale-store.ts';
import { EvidencePage } from './evidence-page.tsx';

describe('EvidencePage', () => {
  it('lists sandbox executions with their tiers and digests', () => {
    setLocale('en');
    render(<EvidencePage />);

    expect(screen.getByRole('heading', { name: 'Sandbox ledger' })).toBeVisible();
    expect(screen.getByRole('row', { name: /Rebalance 20%/ })).toHaveTextContent('TIER_3_EXECUTE');
    expect(screen.getByText('9f2c41ab…e7')).toBeVisible();
  });
});
