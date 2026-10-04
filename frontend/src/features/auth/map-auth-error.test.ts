import { describe, expect, it } from 'vitest';
import { ApiError, NETWORK_ERROR_CODE } from '../../lib/api-error.ts';
import { mapAuthError } from './map-auth-error.ts';

describe('mapAuthError', () => {
  it('puts a taken email under the email field', () => {
    expect(mapAuthError(new ApiError(409, 'AU_1001', 'x'))).toEqual({ field: 'email', message: 'An account with this email already exists.' });
  });

  it('keeps bad credentials at form level, naming neither field', () => {
    expect(mapAuthError(new ApiError(401, 'AU_1002', 'x')).field).toBeUndefined();
  });

  it('explains network failures', () => {
    expect(mapAuthError(new ApiError(0, NETWORK_ERROR_CODE, 'x')).message).toMatch(/can't reach the server/i);
  });

  it('falls back for anything unknown', () => {
    expect(mapAuthError(new Error('boom')).message).toMatch(/something went wrong/i);
  });
});
