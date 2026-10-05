import { AUTH_ERROR_CODES } from '@wealth-advisor/rules';
import { describe, expect, it } from 'vitest';
import { AUTH_ERROR_MESSAGES } from '../../features/auth/errors/auth-error-messages.ts';
import { ApiError, CLIENT_ERROR_CODES } from '../api-error.ts';
import { toFieldMessage } from '../validation/validation-messages.ts';
import { resolveError } from './resolve-error.ts';
import { FALLBACK_ERROR_MESSAGE } from './shared-error-messages.ts';

describe('resolveError', () => {
  it('prefers the feature map, with its target field', () => {
    expect(resolveError(new ApiError(409, AUTH_ERROR_CODES.emailTaken, 'x'), AUTH_ERROR_MESSAGES)).toEqual({
      field: 'email',
      message: 'An account with this email already exists.',
    });
  });

  it('falls back to the shared map, then to the generic message', () => {
    expect(resolveError(new ApiError(0, CLIENT_ERROR_CODES.network, 'x'), {}).message).toMatch(/can't reach the server/i);
    expect(resolveError(new Error('boom'), {}).message).toBe(FALLBACK_ERROR_MESSAGE);
  });
});

describe('toFieldMessage', () => {
  it('turns a validation key into text and passes resolved text through', () => {
    expect(toFieldMessage('email.invalid')).toBe('Enter a valid email address.');
    expect(toFieldMessage('Already human text.')).toBe('Already human text.');
  });
});
