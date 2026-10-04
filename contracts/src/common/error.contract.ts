import { z } from 'zod';

// Every non-2xx response body.
export const ErrorResponse = z.object({
  code: z.string(),
  message: z.string(),
});
export type ErrorResponse = z.infer<typeof ErrorResponse>;
