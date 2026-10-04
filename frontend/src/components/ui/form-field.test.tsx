import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FormField } from './form-field.tsx';
import { Input } from './input.tsx';

describe('FormField', () => {
  it('labels the control and links it to the hint', () => {
    render(<FormField label="Email" hint="We never share it.">{(control) => <Input {...control} />}</FormField>);
    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription('We never share it.');
  });

  it('replaces the hint with the error and marks the control invalid', () => {
    render(
      <FormField label="Email" hint="We never share it." error="Enter a valid email address.">
        {(control) => <Input {...control} />}
      </FormField>,
    );
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Enter a valid email address.');
    expect(screen.queryByText('We never share it.')).not.toBeInTheDocument();
  });
});
