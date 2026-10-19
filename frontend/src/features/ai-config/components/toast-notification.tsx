import { useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface ToastNotificationProps {
  title: string;
  message: string;
  modelName: string;
  onClose: () => void;
  durationMs?: number;
}

export function ToastNotification({
  title,
  message,
  modelName,
  onClose,
  durationMs = 5000,
}: ToastNotificationProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, durationMs);
    return () => clearTimeout(timer);
  }, [onClose, durationMs]);

  return (
    <div
      role="alert"
      className="fixed bottom-6 right-6 z-50 flex max-w-md items-start gap-3 rounded-field border border-emerald-500/30 bg-surface p-4 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 dark:border-emerald-500/40"
    >
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 aria-hidden className="size-4" />
      </div>

      <div className="flex-1">
        <p className="font-display text-sm font-semibold text-ink">{title}</p>
        <p className="mt-0.5 text-xs text-subtle leading-relaxed">{message}</p>
        <div className="mt-2 inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
          <span>Active:</span>
          <span>{modelName}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss notification"
        className="rounded p-1 text-subtle hover:bg-surface-subtle hover:text-ink transition-colors"
      >
        <X aria-hidden className="size-4" />
      </button>
    </div>
  );
}
