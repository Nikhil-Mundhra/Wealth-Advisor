import type { Context } from 'hono';
import { AppError } from '#core/errors/app-error.ts';
import { CORE_ERROR_CODES } from '@wealth-advisor/rules';

// An empty body reads as {} so contracts whose fields are all optional (e.g. refresh via cookie) still validate.
export async function readJsonBody(c: Context): Promise<unknown> {
  const text = await c.req.text();
  if (text.trim() === '') return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new AppError(400, CORE_ERROR_CODES.invalidJson, 'request body is not valid JSON');
  }
}
