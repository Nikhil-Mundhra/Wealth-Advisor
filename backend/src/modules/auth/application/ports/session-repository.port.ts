import type { RevokeReason, Session } from '../../domain/entities/session.entity.ts';
import type { TokenHash } from '../../domain/value-objects/token-hash.vo.ts';

export interface SessionRepositoryPort {
  insert(session: Session): Promise<void>;
  findByTokenHash(tokenHash: TokenHash): Promise<Session | null>;
  // Compare-and-set: persists an in-memory rotation only if the stored session is still unrevoked.
  // Exactly one of two concurrent rotations of the same session gets true.
  compareAndSetRotated(session: Session): Promise<boolean>;
  // Persists an in-memory revoke only if the stored session is still unrevoked.
  revokeIfActive(session: Session): Promise<boolean>;
  revokeFamily(familyId: string, reason: RevokeReason, now: Date): Promise<number>;
  revokeAllForUser(userId: string, reason: RevokeReason, now: Date): Promise<number>;
}
