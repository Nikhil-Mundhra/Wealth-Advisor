import type { ComponentProps } from 'react';
import { Link } from 'react-router';
import { cn } from '../../lib/cn.ts';

export function TextLink({ className, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      className={cn('font-semibold text-brand-600 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-brand-600', className)}
      {...props}
    />
  );
}
