import { type ReactNode, useEffect, useId, useRef } from 'react';
import { cn } from '../../lib/cn.ts';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}

// Native modal <dialog>: the browser traps focus, makes the page behind it inert, closes on Escape and returns
// focus to the opener. Escape and backdrop clicks both report through onClose.
export function Dialog({ open, onClose, title, children, className }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => event.target === event.currentTarget && onClose()}
      className={cn(
        'mx-auto mt-auto mb-0 w-full max-w-md rounded-t-field border border-line bg-surface p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-ink backdrop:bg-black/50 sm:mb-auto sm:rounded-field sm:pb-6',
        className,
      )}
    >
      <h2 id={titleId} className="text-lg font-semibold">
        {title}
      </h2>
      {children}
    </dialog>
  );
}
