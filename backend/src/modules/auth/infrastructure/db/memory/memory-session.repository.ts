import type { SessionRepositoryPort } from '../../../application/ports/session-repository.port.ts';
import type { RevokeReason, Session } from '../../../domain/entities/session.entity.ts';
import type { TokenHash } from '../../../domain/value-objects/token-hash.vo.ts';
import type { SessionDocument } from '../documents/session.document.ts';
import { sessionMapper } from '../mappers/session.mapper.ts';

// SessionRepositoryPort in process memory for local runs without a database. Each compare-and-set reads and
// writes with no await in between, so it is atomic on the single JS thread, matching the MongoDB filters.
export class MemorySessionRepository implements SessionRepositoryPort {
  private readonly documents = new Map<string, SessionDocument>();

  async insert(session: Session): Promise<void> {
    const document = sessionMapper.toDocument(session);
    if (this.findByHash(document.tokenHash)) throw new Error('duplicate tokenHash');
    this.documents.set(document._id.toHexString(), document);
  }

  async findByTokenHash(tokenHash: TokenHash): Promise<Session | null> {
    const document = this.findByHash(tokenHash.value);
    return document ? sessionMapper.toEntity(document) : null;
  }

  async compareAndSetRotated(session: Session): Promise<boolean> {
    return this.replaceIfUnrevoked(session);
  }

  async revokeIfActive(session: Session): Promise<boolean> {
    return this.replaceIfUnrevoked(session);
  }

  async revokeFamily(familyId: string, reason: RevokeReason, now: Date): Promise<number> {
    return this.revokeWhere((document) => document.familyId.toHexString() === familyId, reason, now);
  }

  async revokeAllForUser(userId: string, reason: RevokeReason, now: Date): Promise<number> {
    return this.revokeWhere((document) => document.userId.toHexString() === userId, reason, now);
  }

  private replaceIfUnrevoked(session: Session): boolean {
    const next = sessionMapper.toDocument(session);
    const current = this.documents.get(next._id.toHexString());
    if (!current || current.revokedAt !== null) return false;
    this.documents.set(next._id.toHexString(), next);
    return true;
  }

  private revokeWhere(matches: (document: SessionDocument) => boolean, reason: RevokeReason, now: Date): number {
    let count = 0;
    for (const document of this.documents.values()) {
      if (document.revokedAt !== null || !matches(document)) continue;
      Object.assign(document, { revokedAt: now, revokeReason: reason, updatedAt: now });
      count += 1;
    }
    return count;
  }

  private findByHash(tokenHash: string): SessionDocument | undefined {
    for (const document of this.documents.values()) if (document.tokenHash === tokenHash) return document;
    return undefined;
  }
}
