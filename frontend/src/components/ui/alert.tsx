import type { ComponentProps } from 'react';
import { type VariantProps, cva } from 'class-variance-authority';
import { cn } from '../../lib/cn.ts';

const alertVariants = cva('rounded-field border px-4 py-3 text-sm', {
  variants: {
    tone: {
      error: 'border-red-200 bg-red-50 text-danger dark:border-red-900 dark:bg-red-950/50',
      info: 'border-brand-100 bg-brand-50 text-brand-700 dark:border-brand-100 dark:bg-brand-100/20 dark:text-brand-900',
    },
  },
  defaultVariants: { tone: 'error' },
});

// role="alert" makes screen readers announce the message as soon as it appears.
export function Alert({ tone, className, ...props }: ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  return <div role="alert" className={cn(alertVariants({ tone }), className)} {...props} />;
}
