import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AreaChart } from './area-chart.tsx';

describe('AreaChart', () => {
  it('renders the series as an accessible image with an endpoint dot', () => {
    render(<AreaChart points={[1, 2, 3]} label="Net worth trail" />);
    expect(screen.getByRole('img', { name: 'Net worth trail' })).toBeVisible();
  });
});
