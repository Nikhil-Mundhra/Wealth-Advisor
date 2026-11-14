import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import type { MiddlewareHandler } from 'hono';

export interface CorrelationContext {
  readonly correlationId: string;
  readonly requestId: string;
}

const correlationStorage = new AsyncLocalStorage<CorrelationContext>();

const SAFE_CORRELATION_ID = /^[a-zA-Z0-9._:-]{1,128}$/;

export function sanitizeCorrelationId(raw: string | undefined): string {
  const trimmed = raw?.trim();
  if (trimmed && SAFE_CORRELATION_ID.test(trimmed)) {
    return trimmed;
  }
  return randomUUID();
}

export function getCorrelationContext(): CorrelationContext | undefined {
  return correlationStorage.getStore();
}

export function getCorrelationId(): string | undefined {
  return correlationStorage.getStore()?.correlationId;
}

export function getRequestId(): string | undefined {
  return correlationStorage.getStore()?.requestId;
}

export function runWithCorrelation<T>(
  correlationId: string,
  fn: () => T,
  requestId: string = randomUUID(),
): T {
  return correlationStorage.run(
    { correlationId: sanitizeCorrelationId(correlationId), requestId },
    fn,
  );
}

/**
 * Propagates or mints `X-Correlation-Id` across every request so logs, traces,
 * outbox events, and client bug reports share one traceable id.
 */
export function correlationMiddleware(): MiddlewareHandler {
  return async (c, next) => {
    const correlationId = sanitizeCorrelationId(c.req.header('x-correlation-id'));
    const requestId = randomUUID();
    c.header('X-Correlation-Id', correlationId);
    await correlationStorage.run({ correlationId, requestId }, async () => {
      await next();
      if (!c.res.headers.has('X-Correlation-Id')) {
        c.res.headers.set('X-Correlation-Id', correlationId);
      }
    });
  };
}
