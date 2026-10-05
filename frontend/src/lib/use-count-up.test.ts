import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useCountUp } from './use-count-up.ts';

describe('useCountUp', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('lands exactly on the target', async () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })));
    const { result } = renderHook(() => useCountUp(95000, 50));
    await waitFor(() => expect(result.current).toBe(95000));
  });

  it('jumps straight with reduced motion', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })));
    const { result } = renderHook(() => useCountUp(95000));
    expect(result.current).toBe(95000);
  });
});
