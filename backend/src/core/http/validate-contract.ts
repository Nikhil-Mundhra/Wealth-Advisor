import type { z } from 'zod';
import type { ErrorIssue } from '@wealth-advisor/contracts';
import { CORE_ERROR_CODES } from '@wealth-advisor/rules';
import { AppError } from '#core/errors/app-error.ts';

// Runs a contract schema against untrusted input. Failures become one 400 carrying every failed field as an issue
// (path + validation key), so clients can show each message under its field.
export function parseContract<S extends z.ZodType>(schema: S, input: unknown): z.output<S> {
  const result = schema.safeParse(input);
  if (result.success) return result.data;
  const issues: ErrorIssue[] = result.error.issues.map((issue) => ({ path: issue.path.map(String), code: issue.message }));
  const summary = issues.map((issue) => `${issue.path.join('.') || '(body)'}: ${issue.code}`).join('; ');
  throw new AppError(400, CORE_ERROR_CODES.validationFailed, summary, issues);
}
