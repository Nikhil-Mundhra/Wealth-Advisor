import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useReveal } from './use-reveal.ts';

function Probe() {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} data-visible={visible}>
      probe
    </div>
  );
}

describe('useReveal', () => {
  it('shows content immediately without IntersectionObserver', () => {
    render(<Probe />);
    expect(screen.getByText('probe')).toHaveAttribute('data-visible', 'true');
  });

  it('flips visible when the node scrolls in, then stops observing', () => {
    const observe = vi.fn();
    const disconnect = vi.fn();
    let callback: IntersectionObserverCallback = () => undefined;
    vi.stubGlobal(
      'IntersectionObserver',
      // function, not an arrow: the hook constructs it with new.
      vi.fn(function (seen: IntersectionObserverCallback) {
        callback = seen;
        return { observe, disconnect };
      }),
    );
    render(<Probe />);
    expect(observe).toHaveBeenCalled();
    act(() => {
      callback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    });
    expect(screen.getByText('probe')).toHaveAttribute('data-visible', 'true');
    expect(disconnect).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
