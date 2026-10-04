import type { ClientType } from '../../domain/entities/session.entity.ts';

// clientType and rememberMe let the presentation layer decide between cookie and body delivery.
export interface TokenPairResult {
  readonly accessToken: string;
  readonly accessTokenExpiresIn: number;
  readonly refreshToken: string;
  readonly refreshTokenExpiresAt: Date;
  readonly clientType: ClientType;
  readonly rememberMe: boolean;
}
