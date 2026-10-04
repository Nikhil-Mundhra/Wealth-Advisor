import type { ReactNode } from 'react';

// A horizontal rule, optionally with centered text ("Or").
export function Divider({ children }: { children?: ReactNode }) {
  if (!children) return <hr className="border-line" />;
  return (
    <div role="separator" className="flex items-center gap-3 text-sm text-subtle">
      <span className="h-px flex-1 bg-line" aria-hidden="true" />
      {children}
      <span className="h-px flex-1 bg-line" aria-hidden="true" />
    </div>
  );
}
