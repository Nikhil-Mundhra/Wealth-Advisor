import type { MeResponse, SignupResponse, TokenPairResponse } from '@wealth-advisor/contracts';
import type { SignupResult } from '../../application/dto/signup.result.ts';
import type { TokenPairResult } from '../../application/dto/token-pair.result.ts';
import type { UserProfileResult } from '../../application/dto/user-profile.result.ts';

export function toSignupResponse(result: SignupResult): SignupResponse {
  return { userId: result.userId };
}

export function toTokenPairResponse(result: TokenPairResult, includeRefreshToken: boolean): TokenPairResponse {
  return {
    accessToken: result.accessToken,
    tokenType: 'Bearer',
    expiresIn: result.accessTokenExpiresIn,
    ...(includeRefreshToken ? { refreshToken: result.refreshToken } : {}),
  };
}

export function toMeResponse(result: UserProfileResult): MeResponse {
  return {
    id: result.id,
    email: result.email,
    displayName: result.displayName,
    roles: [...result.roles],
    emailVerified: result.emailVerified,
    createdAt: result.createdAt.toISOString(),
  };
}
