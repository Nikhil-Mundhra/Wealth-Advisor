import { z } from 'zod';

// One failed field: path into the request body and a validation key (or another stable code).
export const ErrorIssue = z.object({
  path: z.array(z.string()),
  code: z.string(),
});
export type ErrorIssue = z.infer<typeof ErrorIssue>;

// Every non-2xx response body. `code` stays a plain string so new codes never break older clients;
// `message` is developer text, not UI copy.
export const ErrorResponse = z.object({
  code: z.string(),
  message: z.string(),
  issues: z.array(ErrorIssue).optional(),
});
export type ErrorResponse = z.infer<typeof ErrorResponse>;
