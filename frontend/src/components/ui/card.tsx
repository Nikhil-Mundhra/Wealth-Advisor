import type { ComponentProps } from 'react';
import { cn } from '../../lib/cn.ts';

export const cardClassName = 'rounded-field border border-line bg-surface p-5';

// A labelled section, so each card is a named region for screen readers.
export function Card({ className, ...props }: ComponentProps<'section'>) {
  return <section className={cn(cardClassName, className)} {...props} />;
}
