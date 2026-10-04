import { cn } from '../../lib/cn.ts';

interface SpinnerProps {
  className?: string;
  // When set, the spinner announces itself; without it, it is decorative (e.g. inside a busy button).
  label?: string;
}

export function Spinner({ className, label }: SpinnerProps) {
  const icon = (
    <svg className={cn('size-5 animate-spin', className)} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
  if (!label) return icon;
  return (
    <span role="status" className="inline-flex items-center gap-2">
      {icon}
      <span className="sr-only">{label}</span>
    </span>
  );
}
