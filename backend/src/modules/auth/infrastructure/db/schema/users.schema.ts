import { DISPLAY_NAME_MAX_LENGTH, EMAIL_MAX_LENGTH, ROLES } from '@wealth-advisor/rules';
import type { CollectionDefinition } from '#core/db/schema/collection-definition.ts';
import { nullable } from '#core/db/schema/nullable.ts';
import { MAX_PROVIDERS, PROVIDER_TYPES, USER_STATUSES } from '../../../domain/entities/user.entity.ts';
import { USERS_COLLECTION } from '../documents/user.document.ts';

export const usersSchema: CollectionDefinition = {
  name: USERS_COLLECTION,
  indexes: [
    // One ACTIVE account per external identity.
    // Filtered on a status string: partial-index filters support plain equality, not "deletedAt is null".
    {
      key: { 'providers.type': 1, 'providers.subject': 1 },
      name: 'uk_users_active_provider',
      unique: true,
      partialFilterExpression: { status: 'ACTIVE' },
    },
    // The email is the login name: one ACTIVE account per email. Stored normalized (trimmed, lowercased).
    { key: { email: 1 }, name: 'uk_users_active_email', unique: true, partialFilterExpression: { status: 'ACTIVE' } },
  ],
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: [
        'email', 'emailVerifiedAt', 'passwordHash', 'displayName', 'status', 'roles',
        'providers', 'consents', 'withdrawal', 'createdAt', 'updatedAt',
      ],
      properties: {
        tenantId: nullable('objectId'),
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
            required: ['type', 'subject', 'email', 'linkedAt', 'lastLoginAt'],
            properties: {
              type: { enum: [...PROVIDER_TYPES] },
              subject: { bsonType: 'string' },
              email: nullable('string'),
              linkedAt: { bsonType: 'date' },
              lastLoginAt: nullable('date'),
            },
          },
        },
        consents: { bsonType: 'array' },
        withdrawal: nullable('object'),
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' },
      },
    },
  },
};
