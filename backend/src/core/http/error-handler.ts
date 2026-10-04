import type { ErrorHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { ErrorResponse } from '@wealth-advisor/contracts';
import { AppError } from '#core/errors/app-error.ts';
import { CoreErrorCodes } from '#core/errors/error-codes.ts';

// Turns any thrown error into the shared error contract. Unknown errors are logged and hidden from the client.
export const errorHandler: ErrorHandler = (error, c) => {
  if (error instanceof AppError) {
    const body: ErrorResponse = { code: error.code, message: error.message };
    return c.json(body, error.status as ContentfulStatusCode);
  }
  if (error instanceof HTTPException) {
    return error.getResponse();
  }
  console.error('[unhandled]', error);
  const body: ErrorResponse = { code: CoreErrorCodes.internal, message: 'internal error' };
  return c.json(body, 500);
};
