import type { z } from 'zod';
import { AppError } from '#core/errors/app-error.ts';
import { CoreErrorCodes } from '#core/errors/error-codes.ts';

// Runs a contract schema against untrusted input; failures become one 400 listing every invalid field.
export function parseContract<S extends z.ZodType>(schema: S, input: unknown): z.output<S> {
  const result = schema.safeParse(input);
  if (result.success) return result.data;
  const details = result.error.issues
    .map((issue) => `${issue.path.length > 0 ? issue.path.join('.') : '(body)'}: ${issue.message}`)
    .join('; ');
  throw new AppError(400, CoreErrorCodes.validationFailed, details);
}
