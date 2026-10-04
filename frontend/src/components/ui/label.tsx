import type { ComponentProps } from 'react';
import { cn } from '../../lib/cn.ts';

export function Label({ className, ...props }: ComponentProps<'label'>) {
  return <label className={cn('block text-sm font-medium text-ink', className)} {...props} />;
}
