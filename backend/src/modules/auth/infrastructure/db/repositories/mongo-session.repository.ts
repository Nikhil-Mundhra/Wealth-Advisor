import { ObjectId } from 'mongodb';
import type { Clock } from '#core/time/clock.ts';
import { BaseRepository, type CollectionProvider } from '#core/db/repository/base-repository.ts';
import type { RevokeReason, Session } from '../../../domain/entities/session.entity.ts';
import type { TokenHash } from '../../../domain/value-objects/token-hash.vo.ts';
import type { SessionRepositoryPort } from '../../../application/ports/session-repository.port.ts';
import type { SessionDocument } from '../documents/session.document.ts';
import { sessionMapper } from '../mappers/session.mapper.ts';

// Conditional single-document updates instead of row locks (SELECT ... FOR UPDATE): the filter
// { revokedAt: null } makes each write a compare-and-set, so concurrent requests cannot both win.
export class MongoSessionRepository extends BaseRepository<SessionDocument> implements SessionRepositoryPort {
  constructor(collection: CollectionProvider<SessionDocument>, clock: Clock) {
    super(collection, clock);
  }

  async insert(session: Session): Promise<void> {
    await this.insertDocument(sessionMapper.toDocument(session));
  }

  async findByTokenHash(tokenHash: TokenHash): Promise<Session | null> {
    const document = await this.findOneDocument({ tokenHash: tokenHash.value });
    return document ? sessionMapper.toEntity(document) : null;
  }

  async compareAndSetRotated(session: Session): Promise<boolean> {
    const document = sessionMapper.toDocument(session);
    const matched = await this.setOne(
      { _id: document._id, revokedAt: null },
      {
        replacedBy: document.replacedBy,
        lastUsedAt: document.lastUsedAt,
        revokedAt: document.revokedAt,
        revokeReason: document.revokeReason,
      },
    );
    return matched === 1;
  }

  async revokeIfActive(session: Session): Promise<boolean> {
    const document = sessionMapper.toDocument(session);
    const matched = await this.setOne(
      { _id: document._id, revokedAt: null },
      { revokedAt: document.revokedAt, revokeReason: document.revokeReason },
    );
    return matched === 1;
  }

  async revokeFamily(familyId: string, reason: RevokeReason, now: Date): Promise<number> {
    return this.setMany({ familyId: new ObjectId(familyId), revokedAt: null }, { revokedAt: now, revokeReason: reason });
  }

  async revokeAllForUser(userId: string, reason: RevokeReason, now: Date): Promise<number> {
    return this.setMany({ userId: new ObjectId(userId), revokedAt: null }, { revokedAt: now, revokeReason: reason });
  }

  async deleteAllForUser(userId: string): Promise<number> {
    if (!ObjectId.isValid(userId)) return 0;
    return this.deleteMany({ userId: new ObjectId(userId) });
  }
}
