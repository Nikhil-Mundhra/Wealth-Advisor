import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CurrencyScrollInput } from './currency-scroll-input.tsx';
import { getDenominationTiers } from '../lib/currency-denominations.ts';

describe('CurrencyScrollInput', () => {
  it('calibrates denomination tiers based on purchasing power and nominal scale', () => {
    expect(getDenominationTiers('AED')).toEqual([5, 10, 50, 100, 500]);
    expect(getDenominationTiers('USD')).toEqual([1, 5, 10, 25, 100]);
    expect(getDenominationTiers('EUR')).toEqual([1, 5, 10, 25, 100]);
    expect(getDenominationTiers('GBP')).toEqual([1, 5, 10, 25, 100]);
    expect(getDenominationTiers('INR')).toEqual([100, 250, 1000, 2500, 10000]);
    expect(getDenominationTiers('JPY')).toEqual([200, 500, 2000, 5000, 20000]);
    expect(getDenominationTiers('SGD')).toEqual([2, 5, 20, 50, 250]);
    expect(getDenominationTiers('CNY')).toEqual([10, 20, 100, 200, 1000]);
  });

  it('renders input with value and handles manual typing', async () => {
    function StatefulInput() {
      const [val, setVal] = useState<number | undefined>(150);
      return (
        <CurrencyScrollInput
          id="test-aed"
          currency="AED"
          value={val}
          onChange={setVal}
        />
      );
    }

    render(<StatefulInput />);

    const input = screen.getByRole('spinbutton');
    expect(input).toHaveValue(150);

    await userEvent.clear(input);
    expect(input).toHaveValue(null);

    await userEvent.type(input, '500');
    expect(input).toHaveValue(500);
  });

  it('scrolls slowly to add low denomination (5 AED) and fast to add high denomination (500 AED)', () => {
    // Wheel tiers derive from event timing, so pin the clock: consecutive events 5ms apart.
    let now = 1000;
    const nowSpy = vi.spyOn(performance, 'now').mockImplementation(() => now);
    try {
      const onChange = vi.fn();
    const { rerender } = render(
      <CurrencyScrollInput
        id="test-aed"
        currency="AED"
        value={100}
        onChange={onChange}
      />,
    );

    const input = screen.getByRole('spinbutton');

    // Slow scroll up (low deltaY): steps by 5 AED (Tier 0)
    fireEvent.wheel(input, { deltaY: -5 });
    expect(onChange).toHaveBeenCalledWith(105);
    // Fast scroll up (large deltaY with rapid velocity): steps by 500 AED (Tier 4)
    onChange.mockClear();
    rerender(
      <CurrencyScrollInput
        id="test-aed"
        currency="AED"
        value={100}
        onChange={onChange}
      />,
    );

    now += 5;
    fireEvent.wheel(input, { deltaY: -500 });
    expect(onChange).toHaveBeenCalledWith(600);
    } finally {
      nowSpy.mockRestore();
    }
  });

  it('scales relatively for PPP in other currencies (USD: $1 to $100, INR: ₹100 to ₹10,000)', () => {
    const onChangeUsd = vi.fn();
    const { rerender } = render(
      <CurrencyScrollInput
        id="test-usd"
        currency="USD"
        value={50}
        onChange={onChangeUsd}
      />,
    );

    const inputUsd = screen.getByRole('spinbutton');

    // Slow scroll up in USD: steps by $1
    fireEvent.wheel(inputUsd, { deltaY: -5 });
    expect(onChangeUsd).toHaveBeenCalledWith(51);

    // Fast scroll up in USD: steps by $100
    onChangeUsd.mockClear();
    rerender(
      <CurrencyScrollInput
        id="test-usd"
        currency="USD"
        value={50}
        onChange={onChangeUsd}
      />,
    );
    fireEvent.wheel(inputUsd, { deltaY: -500 });
    expect(onChangeUsd).toHaveBeenCalledWith(150);

    // INR Test
    const onChangeInr = vi.fn();
    render(
      <CurrencyScrollInput
        id="test-inr"
        currency="INR"
        value={1000}
        onChange={onChangeInr}
      />,
    );

    const inputInr = screen.getAllByRole('spinbutton')[1];
    fireEvent.wheel(inputInr, { deltaY: -5 });
    expect(onChangeInr).toHaveBeenCalledWith(1100); // 1000 + 100 INR
  });

  it('handles keyboard arrow navigation and clamps at 0', () => {
    const onChange = vi.fn();
    render(
      <CurrencyScrollInput
        id="test-clamp"
        currency="AED"
        value={5}
        onChange={onChange}
      />,
    );

    const input = screen.getByRole('spinbutton');

    // Down arrow: decreases by step (10 AED) but clamped at 0
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(onChange).toHaveBeenCalledWith(0);

    // Shift + Up Arrow: boosts to fastest tier (500 AED)
    onChange.mockClear();
    fireEvent.keyDown(input, { key: 'ArrowUp', shiftKey: true });
    expect(onChange).toHaveBeenCalledWith(505);
  });
});
