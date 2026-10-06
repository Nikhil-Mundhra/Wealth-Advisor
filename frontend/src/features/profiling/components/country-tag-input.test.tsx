import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CountryTagInput } from './country-tag-input.tsx';

describe('CountryTagInput', () => {
  it('renders popular preset buttons and allows 1-tap selection', async () => {
    const onChange = vi.fn();
    render(
      <CountryTagInput
        id="country-res"
        label="Country of residence"
        value=""
        onChange={onChange}
        multiple={false}
      />,
    );

    expect(screen.getByText('Country of residence')).toBeVisible();
    const dePreset = screen.getByRole('button', { name: 'Preset Germany' });
    expect(dePreset).toBeVisible();

    await userEvent.click(dePreset);
    expect(onChange).toHaveBeenCalledWith('DE');
  });

  it('renders selected tag and allows removal', async () => {
    const onChange = vi.fn();
    render(
      <CountryTagInput
        id="country-res"
        label="Country of residence"
        value="DE"
        onChange={onChange}
        multiple={false}
      />,
    );

    expect(screen.getByText('(DE)')).toBeVisible();
    const removeBtn = screen.getByRole('button', { name: 'Remove Germany' });
    expect(removeBtn).toBeVisible();

    await userEvent.click(removeBtn);
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('handles multi-country selection for income or remittances', async () => {
    const onChange = vi.fn();
    render(
      <CountryTagInput
        id="country-inc"
        label="Income sources"
        value={['DE']}
        onChange={onChange}
        multiple={true}
      />,
    );

    expect(screen.getByText('(DE)')).toBeVisible();

    const ukPreset = screen.getByRole('button', { name: 'Preset UK' });
    await userEvent.click(ukPreset);
    expect(onChange).toHaveBeenCalledWith(['DE', 'GB']);
  });

  it('filters countries via autocomplete search', async () => {
    const onChange = vi.fn();
    render(
      <CountryTagInput
        id="country-res"
        label="Residence"
        value=""
        onChange={onChange}
        multiple={false}
        placeholder="Type country…"
      />,
    );

    const input = screen.getByPlaceholderText('Type country…');
    await userEvent.type(input, 'Singapore');

    const suggestion = await screen.findByRole('button', { name: 'Select Singapore' });
    expect(suggestion).toBeVisible();

    await userEvent.click(suggestion);
    expect(onChange).toHaveBeenCalledWith('SG');
  });
});
