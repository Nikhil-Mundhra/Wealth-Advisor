import { generateOpaqueToken } from '#core/crypto/random-token.ts';
import { sha256Hex } from '#core/crypto/sha256.ts';
import type { Session } from '../../domain/entities/session.entity.ts';
import type { User } from '../../domain/entities/user.entity.ts';
import { TokenHash } from '../../domain/value-objects/token-hash.vo.ts';
import type { TokenPairResult } from '../dto/token-pair.result.ts';
import type { AccessTokenSignerPort } from '../ports/access-token-signer.port.ts';
import type { SessionRepositoryPort } from '../ports/session-repository.port.ts';

export interface NewRefreshToken {
  readonly raw: string;
  readonly hash: TokenHash;
}

interface TokenPairIssuerDeps {
  readonly sessions: SessionRepositoryPort;
  readonly signer: AccessTokenSignerPort;
}

// Shared last step of login and refresh: store the new session, sign an access token, shape the result.
export class TokenPairIssuer {
  private readonly deps: TokenPairIssuerDeps;

  constructor(deps: TokenPairIssuerDeps) {
    this.deps = deps;
  }

  // The raw value goes to the client once; only its hash is ever stored.
  static newRefreshToken(): NewRefreshToken {
    const raw = generateOpaqueToken();
    return { raw, hash: TokenHash.of(sha256Hex(raw)) };
  }

  async issue(user: User, session: Session, rawRefreshToken: string): Promise<TokenPairResult> {
    await this.deps.sessions.insert(session);
    const access = await this.deps.signer.sign({ subject: user.id, roles: user.roles });
    return {
      accessToken: access.token,
      accessTokenExpiresIn: access.expiresIn,
      refreshToken: rawRefreshToken,
      refreshTokenExpiresAt: session.expiresAt,
      clientType: session.clientType,
      rememberMe: session.rememberMe,
    };
  }
}
