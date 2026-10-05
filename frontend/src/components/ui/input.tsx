import type { ComponentProps } from 'react';
import { cn } from '../../lib/cn.ts';

// Invalid styling follows aria-invalid, so the visual state and the accessible state cannot drift apart.
export function Input({ className, ...props }: ComponentProps<'input'>) {
  return (
    <input
      className={cn(
        'h-11 w-full rounded-field border border-line bg-surface px-3.5 text-sm text-ink shadow-xs transition-colors',
        'placeholder:text-subtle focus:border-brand-600 focus:outline-none focus:ring-3 focus:ring-brand-600/15',
        'aria-invalid:border-danger aria-invalid:focus:ring-danger/15 disabled:bg-surface-subtle',
        className,
      )}
      {...props}
    />
  );
}
