import { AUTH_ERROR_CODES as C } from '@wealth-advisor/rules';
import { DomainError } from '#core/domain/domain-error.ts';

// Every error the auth module raises. Messages are developer text; statuses live in presentation/auth-error-statuses.ts.
export const AuthErrors = {
  emailTaken: () => new DomainError(C.emailTaken, 'an account with this email already exists'),
  invalidCredentials: () => new DomainError(C.invalidCredentials, 'invalid email or password'),
  invalidRefreshToken: () => new DomainError(C.invalidRefreshToken, 'refresh token is invalid or expired'),
  alreadyRotated: () => new DomainError(C.alreadyRotated, 'refresh token was already rotated; use the latest token'),
  unauthenticated: () => new DomainError(C.unauthenticated, 'missing or invalid access token'),
  invalidEmail: () => new DomainError(C.invalidEmail, 'email address is invalid'),
  weakPassword: () => new DomainError(C.weakPassword, 'password does not meet the password policy'),
  signingKeysMissing: () => new DomainError(C.signingKeysMissing, 'token signing keys are not configured'),
  invariantViolated: (detail: string) => new DomainError(C.invariantViolated, `auth invariant violated: ${detail}`),
};
