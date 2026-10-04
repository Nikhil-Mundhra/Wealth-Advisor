import type { ErrorHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { ErrorResponse } from '@wealth-advisor/contracts';
import { CORE_ERROR_CODES } from '@wealth-advisor/rules';
import { DomainError } from '#core/domain/domain-error.ts';
import { AppError } from '#core/errors/app-error.ts';
import type { ErrorCatalog } from '#core/errors/error-catalog.ts';

// Turns any thrown error into the shared error contract. Unknown errors are logged and hidden from the client.
export function createErrorHandler(catalog: ErrorCatalog): ErrorHandler {
  return (error, c) => {
    if (error instanceof AppError) {
      const body: ErrorResponse = { code: error.code, message: error.message, ...(error.issues ? { issues: [...error.issues] } : {}) };
      return c.json(body, error.status as ContentfulStatusCode);
    }
    if (error instanceof DomainError) {
      const status = catalog.statusOf(error.code);
      if (status >= 500) console.error('[domain]', error);
      const body: ErrorResponse = { code: error.code, message: error.message };
      return c.json(body, status as ContentfulStatusCode);
    }
    if (error instanceof HTTPException) {
      return error.getResponse();
    }
    console.error('[unhandled]', error);
    const body: ErrorResponse = { code: CORE_ERROR_CODES.internal, message: 'internal error' };
    return c.json(body, 500);
  };
}
