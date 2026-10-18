import type { Context } from 'hono';
import { AppError } from '#core/errors/app-error.ts';
import { CORE_ERROR_CODES } from '@wealth-advisor/rules';

export const MAX_JSON_BODY_BYTES = 1024 * 1024;

// An empty body reads as {} so contracts whose fields are all optional (e.g. refresh via cookie) still validate.
export async function readJsonBody(c: Context): Promise<unknown> {
  const contentLength = c.req.header('content-length');
  if (contentLength && Number.parseInt(contentLength, 10) > MAX_JSON_BODY_BYTES) {
    throw new AppError(413, CORE_ERROR_CODES.payloadTooLarge, 'request body exceeds 1MB limit');
  }
  const text = await c.req.text();
  if (text.length > MAX_JSON_BODY_BYTES) {
    throw new AppError(413, CORE_ERROR_CODES.payloadTooLarge, 'request body exceeds 1MB limit');
  }
  if (text.trim() === '') return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new AppError(400, CORE_ERROR_CODES.invalidJson, 'request body is not valid JSON');
  }
}
