import { CLIENT_TYPES } from '@wealth-advisor/rules';
import type { CollectionDefinition } from '#core/db/schema/collection-definition.ts';
import { nullable } from '#core/db/schema/nullable.ts';
import { REVOKE_REASONS } from '../../../domain/entities/session.entity.ts';
import { TOKEN_HASH_PATTERN } from '../../../domain/value-objects/token-hash.vo.ts';
import { SESSIONS_COLLECTION } from '../documents/session.document.ts';

export const sessionsSchema: CollectionDefinition = {
  name: SESSIONS_COLLECTION,
  indexes: [
    { key: { tokenHash: 1 }, name: 'uk_sessions_token_hash', unique: true },
    { key: { familyId: 1 }, name: 'ix_sessions_family' },
    { key: { userId: 1, revokedAt: 1 }, name: 'ix_sessions_user_active' },
    // Mongo's TTL monitor runs about once a minute, so reads never rely on it; expiry is checked in code.
    { key: { purgeAt: 1 }, name: 'ttl_sessions_purge', expireAfterSeconds: 0 },
  ],
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: [
        'userId', 'tokenHash', 'familyId', 'replacedBy', 'clientType', 'rememberMe', 'issuedAt', 'expiresAt',
        'lastUsedAt', 'revokedAt', 'revokeReason', 'purgeAt', 'createdAt', 'updatedAt',
      ],
      properties: {
        userId: { bsonType: 'objectId' },
        tokenHash: { bsonType: 'string', pattern: TOKEN_HASH_PATTERN.source },
        familyId: { bsonType: 'objectId' },
        replacedBy: nullable('objectId'),
        clientType: { enum: [...CLIENT_TYPES] },
        rememberMe: { bsonType: 'bool' },
        issuedAt: { bsonType: 'date' },
        expiresAt: { bsonType: 'date' },
        lastUsedAt: nullable('date'),
        revokedAt: nullable('date'),
        revokeReason: { enum: [...REVOKE_REASONS, null] },
        purgeAt: { bsonType: 'date' },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' },
      },
    },
  },
};
