import type { UseCase } from '#core/application/use-case.ts';
import { sha256Hex } from '#core/crypto/sha256.ts';
import type { IdGenerator } from '#core/domain/id-generator.ts';
import type { Clock } from '#core/time/clock.ts';
import type { Session } from '../../domain/entities/session.entity.ts';
import { AuthErrors } from '../../domain/errors/auth-errors.ts';
import { decideRotation } from '../../domain/policies/refresh-rotation.policy.ts';
import { TokenHash } from '../../domain/value-objects/token-hash.vo.ts';
import type { TokenConfig } from '../config/token-config.ts';
import type { RefreshCommand } from '../dto/refresh.command.ts';
import type { TokenPairResult } from '../dto/token-pair.result.ts';
import type { SessionRepositoryPort } from '../ports/session-repository.port.ts';
import type { UserRepositoryPort } from '../ports/user-repository.port.ts';
import { TokenPairIssuer } from './issue-token-pair.ts';

interface RefreshTokensDeps {
  readonly users: UserRepositoryPort;
  readonly sessions: SessionRepositoryPort;
  readonly issuer: TokenPairIssuer;
  readonly ids: IdGenerator;
  readonly clock: Clock;
  readonly config: TokenConfig;
}

// Refresh-token rotation. The policy decides; this class loads state, applies the decision and persists it.
export class RefreshTokensUseCase implements UseCase<RefreshCommand, TokenPairResult> {
  private readonly deps: RefreshTokensDeps;

  constructor(deps: RefreshTokensDeps) {
    this.deps = deps;
  }

  async execute(command: RefreshCommand): Promise<TokenPairResult> {
    const { sessions, clock, config } = this.deps;
    const now = clock.now();
    const session = await sessions.findByTokenHash(TokenHash.of(sha256Hex(command.refreshToken)));
    const decision = decideRotation(session, now, config.reuseGraceSeconds);

    switch (decision.kind) {
      case 'INVALID':
        throw AuthErrors.invalidRefreshToken();
      case 'ALREADY_ROTATED':
        throw AuthErrors.alreadyRotated();
      case 'REUSE_DETECTED':
        await sessions.revokeFamily(decision.familyId, 'REUSE_DETECTED', now);
        throw AuthErrors.invalidRefreshToken();
      case 'ROTATE':
        return this.rotate(session as Session, now);
    }
  }

  // Rotate first, then insert the child: if two requests race, the compare-and-set picks one winner and the
  // loser is answered like an in-grace retry. A crash between the two writes logs the user out; it never
  // leaves two live sessions.
  private async rotate(session: Session, now: Date): Promise<TokenPairResult> {
    const { users, sessions, issuer, ids, config } = this.deps;
    const user = await users.findActiveById(session.userId);
    if (!user) throw AuthErrors.invalidRefreshToken();

    const refreshToken = TokenPairIssuer.newRefreshToken();
    const child = session.rotate({ childId: ids.next(), childTokenHash: refreshToken.hash, now, ttlSeconds: config.refreshTokenTtlSeconds });
    if (!(await sessions.compareAndSetRotated(session))) throw AuthErrors.alreadyRotated();
    return issuer.issue(user, child, refreshToken.raw);
  }
}
