import { randomUUID } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';
import type { Clock } from '#core/time/clock.ts';
import type { AccessTokenClaims, AccessTokenSignerPort, SignedAccessToken } from '../../application/ports/access-token-signer.port.ts';
import { AuthErrors } from '../../domain/errors/auth-errors.ts';
import { type KeySource, type SigningKeys, loadSigningKeys } from './jwt-key-loader.ts';

const ALGORITHM = 'EdDSA';
const TOKEN_USE = 'user';

export interface Ed25519JwtSignerConfig {
  readonly issuer: string;
  readonly audience: string;
  readonly keyId: string;
  readonly ttlSeconds: number;
  readonly keys: KeySource;
  readonly clock: Clock;
}

// Access tokens with the claim set: iss, aud, sub, iat, exp, jti, token_use, roles.
export class Ed25519JwtSigner implements AccessTokenSignerPort {
  private readonly config: Ed25519JwtSignerConfig;
  private keys: Promise<SigningKeys> | undefined;

  constructor(config: Ed25519JwtSignerConfig) {
    this.config = config;
  }

  async sign(claims: AccessTokenClaims): Promise<SignedAccessToken> {
    const { issuer, audience, keyId, ttlSeconds, clock } = this.config;
    const { privateKey } = await this.getKeys();
    const issuedAt = Math.floor(clock.now().getTime() / 1000);
    const token = await new SignJWT({ token_use: TOKEN_USE, roles: [...claims.roles] })
      .setProtectedHeader({ alg: ALGORITHM, kid: keyId, typ: 'JWT' })
      .setIssuer(issuer)
      .setAudience(audience)
      .setSubject(claims.subject)
      .setIssuedAt(issuedAt)
      .setExpirationTime(issuedAt + ttlSeconds)
      .setJti(randomUUID())
      .sign(privateKey);
    return { token, expiresIn: ttlSeconds };
  }

  async verify(token: string): Promise<AccessTokenClaims> {
    const { issuer, audience, clock } = this.config;
    const { publicKey } = await this.getKeys();
    let payload;
    try {
      ({ payload } = await jwtVerify(token, publicKey, { issuer, audience, algorithms: [ALGORITHM], currentDate: clock.now() }));
    } catch {
      throw AuthErrors.unauthenticated();
    }
    const roles = payload.roles;
    if (payload.token_use !== TOKEN_USE || typeof payload.sub !== 'string' || !Array.isArray(roles)) {
      throw AuthErrors.unauthenticated();
    }
    return { subject: payload.sub, roles: roles.filter((role): role is string => typeof role === 'string') };
  }

  // Loaded on first use so a missing key fails the request that needs it, not the whole app at import time.
  private getKeys(): Promise<SigningKeys> {
    this.keys ??= loadSigningKeys(this.config.keys).catch((error: unknown) => {
      this.keys = undefined;
      throw error;
    });
    return this.keys;
  }
}
