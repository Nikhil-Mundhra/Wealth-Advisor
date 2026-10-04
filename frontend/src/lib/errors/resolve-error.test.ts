import { AUTH_ERROR_CODES, CORE_ERROR_CODES, VALIDATION_KEYS } from '@wealth-advisor/rules';
import { describe, expect, it } from 'vitest';
import { AUTH_ERROR_MESSAGES } from '../../features/auth/errors/auth-error-messages.ts';
import { ApiError, CLIENT_ERROR_CODES } from '../api-error.ts';
import { VALIDATION_MESSAGES, toFieldMessage } from '../validation/validation-messages.ts';
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

  it('gives every server and client code some text', () => {
    const codes = [...Object.values(CORE_ERROR_CODES), ...Object.values(AUTH_ERROR_CODES), ...Object.values(CLIENT_ERROR_CODES)];
    for (const code of codes) expect(resolveError(new ApiError(400, code, 'x'), AUTH_ERROR_MESSAGES).message.length).toBeGreaterThan(0);
  });
});

describe('validation messages', () => {
  it('have text for every validation key and pass resolved text through', () => {
    for (const key of Object.values(VALIDATION_KEYS)) expect(VALIDATION_MESSAGES[key]).toBeTruthy();
    expect(toFieldMessage('email.invalid')).toBe('Enter a valid email address.');
    expect(toFieldMessage('Already human text.')).toBe('Already human text.');
  });
});
