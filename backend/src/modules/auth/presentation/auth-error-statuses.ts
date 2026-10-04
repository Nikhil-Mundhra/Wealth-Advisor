import { AUTH_ERROR_CODES as C, type AuthErrorCode } from '@wealth-advisor/rules';

// HTTP status for every auth error code. Typed as a full Record, so a new code without a status fails typecheck.
export const AUTH_ERROR_STATUSES: Readonly<Record<AuthErrorCode, number>> = {
  [C.emailTaken]: 409,
  [C.invalidCredentials]: 401,
  [C.invalidRefreshToken]: 401,
  [C.alreadyRotated]: 409,
  [C.unauthenticated]: 401,
  [C.invalidEmail]: 400,
  [C.weakPassword]: 400,
  [C.invariantViolated]: 500,
  [C.signingKeysMissing]: 503,
};
