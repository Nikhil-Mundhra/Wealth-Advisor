import { CLIENT_TYPES, DISPLAY_NAME_MAX_LENGTH, EMAIL_MAX_LENGTH } from '@wealth-advisor/rules';
import type { CollectionDefinition } from '#core/persistence/collection-definition.ts';
import { REVOKE_REASONS } from '../../domain/entities/session.entity.ts';
import { MAX_PROVIDERS, PROVIDER_TYPES, USER_STATUSES } from '../../domain/entities/user.entity.ts';
import { ROLES } from '../../domain/value-objects/role.vo.ts';
import { TOKEN_HASH_PATTERN } from '../../domain/value-objects/token-hash.vo.ts';
import { USERS_COLLECTION } from './documents/user.document.ts';
import { SESSIONS_COLLECTION } from './documents/session.document.ts';

const nullable = (bsonType: string) => ({ bsonType: [bsonType, 'null'] });

const usersCollection: CollectionDefinition = {
  name: USERS_COLLECTION,
  indexes: [
    // One ACTIVE account per external identity (replaces cochika's active_key generated-column trick).
    // Filtered on a status string: partial-index filters support plain equality, not "deletedAt is null".
    {
      key: { 'providers.type': 1, 'providers.subject': 1 },
      name: 'uk_users_active_provider',
      unique: true,
      partialFilterExpression: { status: 'ACTIVE' },
    },
  ],
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'status', 'roles', 'providers', 'consents', 'createdAt', 'updatedAt'],
      properties: {
        email: { bsonType: 'string', maxLength: EMAIL_MAX_LENGTH },
        emailVerifiedAt: nullable('date'),
        passwordHash: nullable('string'),
        displayName: { bsonType: ['string', 'null'], maxLength: DISPLAY_NAME_MAX_LENGTH },
        status: { enum: [...USER_STATUSES] },
        roles: { bsonType: 'array', minItems: 1, items: { enum: [...ROLES] } },
        providers: {
          bsonType: 'array',
          maxItems: MAX_PROVIDERS,
          items: {
            bsonType: 'object',
            required: ['type', 'subject', 'linkedAt'],
            properties: { type: { enum: [...PROVIDER_TYPES] }, subject: { bsonType: 'string' } },
          },
        },
        consents: { bsonType: 'array' },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' },
      },
    },
  },
};

const sessionsCollection: CollectionDefinition = {
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
      required: ['userId', 'tokenHash', 'familyId', 'clientType', 'rememberMe', 'issuedAt', 'expiresAt', 'purgeAt', 'createdAt'],
      properties: {
        userId: { bsonType: 'objectId' },
        tokenHash: { bsonType: 'string', pattern: TOKEN_HASH_PATTERN.source },
        familyId: { bsonType: 'objectId' },
        replacedBy: nullable('objectId'),
        clientType: { enum: [...CLIENT_TYPES] },
        rememberMe: { bsonType: 'bool' },
        expiresAt: { bsonType: 'date' },
        revokedAt: nullable('date'),
        revokeReason: { enum: [...REVOKE_REASONS, null] },
        purgeAt: { bsonType: 'date' },
      },
    },
  },
};

export const authCollections: readonly CollectionDefinition[] = [usersCollection, sessionsCollection];
