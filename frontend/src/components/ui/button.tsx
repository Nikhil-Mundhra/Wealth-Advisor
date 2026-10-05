import type { ComponentProps } from 'react';
import { type VariantProps, cva } from 'class-variance-authority';
import { cn } from '../../lib/cn.ts';
import { Spinner } from './spinner.tsx';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-60',
  {
    variants: {
      variant: {
        primary: 'bg-brand-600 text-white hover:bg-brand-700',
        outline: 'border border-line bg-surface text-ink hover:bg-surface-subtle',
        ghost: 'text-ink hover:bg-surface-subtle',
        inverse: 'border border-white/40 text-white hover:bg-white/10 focus-visible:outline-white',
      },
      size: {
        md: 'h-11 rounded-field px-4 text-sm',
        icon: 'size-11 rounded-full',
      },
      fullWidth: { true: 'w-full' },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export type ButtonProps = ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { loading?: boolean };

// While loading, the button is disabled (no double submit) and marked busy for assistive tech.
export function Button({ variant, size, fullWidth, loading = false, disabled, className, children, type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  );
}
