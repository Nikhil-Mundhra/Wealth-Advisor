import type { ReactNode } from 'react';

interface SplitLayoutProps {
  aside: ReactNode;
  children: ReactNode;
}

// Two panes: decorative media on the left (desktop only), the page content centered on the right.
export function SplitLayout({ aside, children }: SplitLayoutProps) {
  return (
    <div className="grid min-h-dvh bg-surface lg:grid-cols-[1.1fr_1fr]">
      <aside className="hidden lg:block">{aside}</aside>
      <main className="flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-sm space-y-6">{children}</div>
      </main>
    </div>
  );
}
