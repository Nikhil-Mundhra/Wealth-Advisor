import { ObjectId } from 'mongodb';
import { CLIENT_TYPES } from '@wealth-advisor/rules';
import { parseMember } from '#core/domain/parse-member.ts';
import type { Mapper } from '#core/persistence/mapper.ts';
import { REVOKE_REASONS, Session } from '../../../domain/entities/session.entity.ts';
import { AuthErrors } from '../../../domain/errors/auth-errors.ts';
import { TokenHash } from '../../../domain/value-objects/token-hash.vo.ts';
import type { SessionDocument } from '../documents/session.document.ts';

// Sessions are kept this long after expiry so a reused old token can still be recognised and audited.
export const SESSION_RETENTION_AFTER_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

const toObjectId = (id: string | null): ObjectId | null => (id === null ? null : new ObjectId(id));

export const sessionMapper: Mapper<Session, SessionDocument> = {
  toEntity(document) {
    return Session.restore({
      id: document._id.toHexString(),
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      userId: document.userId.toHexString(),
      tokenHash: TokenHash.of(document.tokenHash),
      familyId: document.familyId.toHexString(),
      replacedBy: document.replacedBy ? document.replacedBy.toHexString() : null,
      clientType: parseMember(CLIENT_TYPES, document.clientType, () => AuthErrors.invariantViolated('stored session has an unknown client type')),
      rememberMe: document.rememberMe,
      issuedAt: document.issuedAt,
      expiresAt: document.expiresAt,
      lastUsedAt: document.lastUsedAt,
      revokedAt: document.revokedAt,
      revokeReason:
        document.revokeReason === null
          ? null
          : parseMember(REVOKE_REASONS, document.revokeReason, () => AuthErrors.invariantViolated('stored session has an unknown revoke reason')),
    });
  },

  toDocument(session) {
    const snapshot = session.toSnapshot();
    return {
      _id: new ObjectId(snapshot.id),
      userId: new ObjectId(snapshot.userId),
      tokenHash: snapshot.tokenHash.value,
      familyId: new ObjectId(snapshot.familyId),
      replacedBy: toObjectId(snapshot.replacedBy),
      clientType: snapshot.clientType,
      rememberMe: snapshot.rememberMe,
      issuedAt: snapshot.issuedAt,
      expiresAt: snapshot.expiresAt,
      lastUsedAt: snapshot.lastUsedAt,
      revokedAt: snapshot.revokedAt,
      revokeReason: snapshot.revokeReason,
      purgeAt: new Date(snapshot.expiresAt.getTime() + SESSION_RETENTION_AFTER_EXPIRY_MS),
      createdAt: snapshot.createdAt,
      updatedAt: snapshot.updatedAt,
    };
  },
};
