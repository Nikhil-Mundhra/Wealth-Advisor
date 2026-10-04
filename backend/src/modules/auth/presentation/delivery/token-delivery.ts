import type { Context } from 'hono';
import type { TokenPairResponse } from '@wealth-advisor/contracts';
import type { TokenPairResult } from '../../application/dto/token-pair.result.ts';
import { setRefreshCookie } from '../cookies/refresh-cookie.ts';
import { toTokenPairResponse } from '../mappers/result-to-contract.mapper.ts';

// Decides where the refresh token goes: an HttpOnly cookie for web (never readable by JS), the body for mobile.
export function deliverTokens(c: Context, result: TokenPairResult): TokenPairResponse {
  if (result.clientType === 'WEB') {
    setRefreshCookie(c, result.refreshToken, { rememberMe: result.rememberMe, expiresAt: result.refreshTokenExpiresAt });
    return toTokenPairResponse(result, false);
  }
  return toTokenPairResponse(result, true);
}
