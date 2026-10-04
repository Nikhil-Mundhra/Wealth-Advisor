import type { UseCase } from '#core/application/use-case.ts';
import { sha256Hex } from '#core/crypto/sha256.ts';
import type { Clock } from '#core/time/clock.ts';
import { TokenHash } from '../../domain/value-objects/token-hash.vo.ts';
import type { LogoutCommand } from '../dto/logout.command.ts';
import type { SessionRepositoryPort } from '../ports/session-repository.port.ts';

interface LogoutDeps {
  readonly sessions: SessionRepositoryPort;
  readonly clock: Clock;
}

// Revokes one session (LOGOUT) or every session of the user (LOGOUT_ALL). Idempotent: an unknown, foreign or
// already-revoked token is ignored. Access tokens stay valid until they expire, as in cochika.
export class LogoutUseCase implements UseCase<LogoutCommand, void> {
  private readonly deps: LogoutDeps;

  constructor(deps: LogoutDeps) {
    this.deps = deps;
  }

  async execute(command: LogoutCommand): Promise<void> {
    const { sessions, clock } = this.deps;
    const now = clock.now();
    if (command.kind === 'ALL') {
      await sessions.revokeAllForUser(command.userId, 'LOGOUT_ALL', now);
      return;
    }
    const session = await sessions.findByTokenHash(TokenHash.of(sha256Hex(command.refreshToken)));
    if (!session || session.userId !== command.userId) return;
    if (session.revoke('LOGOUT', now)) await sessions.revokeIfActive(session);
  }
}
