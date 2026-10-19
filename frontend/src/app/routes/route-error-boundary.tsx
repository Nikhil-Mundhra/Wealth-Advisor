import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { useRouteError, isRouteErrorResponse } from 'react-router';
import { Button } from '../../components/ui/button.tsx';
import { Card } from '../../components/ui/card.tsx';

export function RouteErrorBoundary() {
  const error = useRouteError();

  let message = 'An unexpected error occurred while rendering this page.';
  let details: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = `${error.status} ${error.statusText}`;
    details = typeof error.data === 'string' ? error.data : undefined;
  } else if (error instanceof Error) {
    message = error.message;
    details = error.stack;
  }

  return (
    <div className="flex min-h-dvh items-center justify-center p-4 bg-surface text-ink">
      <Card className="w-full max-w-md border-line bg-surface p-6 shadow-xl flex flex-col gap-4">
        <div className="flex items-center gap-3 text-danger">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-danger/10">
            <AlertCircle aria-hidden className="size-5" />
          </div>
          <div>
            <h2 className="font-display text-base font-semibold text-ink">
              Application Notice
            </h2>
            <p className="text-xs text-subtle">
              The application encountered an unexpected state.
            </p>
          </div>
        </div>

        <div className="rounded bg-surface-subtle p-3 text-xs font-mono text-ink/80 border border-line overflow-x-auto">
          {message}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2">
          <Button
            type="button"
            onClick={() => window.location.reload()}
            className="flex items-center gap-1.5"
          >
            <RefreshCw aria-hidden className="size-4" />
            <span>Reload Page</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              window.location.href = '/';
            }}
            className="flex items-center gap-1.5"
          >
            <Home aria-hidden className="size-4" />
            <span>Go Home</span>
          </Button>
        </div>
      </Card>
    </div>
  );
}
