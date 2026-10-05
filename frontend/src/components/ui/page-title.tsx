import type { ComponentProps } from 'react';
import { cn } from '../../lib/cn.ts';

export function PageTitle({ className, ...props }: ComponentProps<'h1'>) {
  return <h1 className={cn('text-2xl font-semibold tracking-tight', className)} {...props} />;
}
