import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ParticlesBackground } from './particles-background.tsx';

describe('ParticlesBackground', () => {
  it('renders decorative canvas container with aria-hidden', () => {
    render(<ParticlesBackground />);
    const container = screen.getByTestId('particles-background');
    expect(container).toBeInTheDocument();
    expect(container).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('canvas')).toBeInTheDocument();
  });

  it('unmounts cleanly without throwing memory or animation errors', () => {
    const { unmount } = render(<ParticlesBackground />);
    expect(() => unmount()).not.toThrow();
  });
});
