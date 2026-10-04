import { AppError } from '#core/errors/app-error.ts';
import { ERROR_CODE_PREFIXES } from '#core/errors/error-codes.ts';

const code = (number: number): string => `${ERROR_CODE_PREFIXES.auth}_${number}`;

// Every error the auth module can return; codes are part of the API and never reused.
export const AuthErrors = {
  emailTaken: () => new AppError(409, code(1001), 'an account with this email already exists'),
  invalidCredentials: () => new AppError(401, code(1002), 'invalid email or password'),
  invalidRefreshToken: () => new AppError(401, code(1003), 'refresh token is invalid or expired'),
  alreadyRotated: () => new AppError(409, code(1004), 'refresh token was already rotated; use the latest token'),
  unauthenticated: () => new AppError(401, code(1005), 'missing or invalid access token'),
  invalidEmail: () => new AppError(400, code(1006), 'email address is invalid'),
  signingKeysMissing: () => new AppError(503, code(1901), 'token signing keys are not configured'),
  invariantViolated: (detail: string) => new AppError(500, code(1900), `auth invariant violated: ${detail}`),
};
