import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { Session } from '#modules/auth/domain/entities/session.entity.ts';
import { User } from '#modules/auth/domain/entities/user.entity.ts';
import { Email } from '#modules/auth/domain/value-objects/email.vo.ts';
import { authCollections } from '#modules/auth/infrastructure/db/schema/auth-collections.ts';
import { sessionMapper } from '#modules/auth/infrastructure/db/mappers/session.mapper.ts';
import { userMapper } from '#modules/auth/infrastructure/db/mappers/user.mapper.ts';
import { T0, hashOf } from '../../support/auth-fixtures.ts';

// The DB validator must enforce exactly the fields the mapper writes; drift on either side fails here.
function schemaOf(name: string) {
  const definition = authCollections.find((collection) => collection.name === name);
  return definition?.validator?.$jsonSchema as { required: string[]; properties: Record<string, unknown> };
}

function assertAligned(name: string, document: object) {
  const schema = schemaOf(name);
  const written = Object.keys(document).filter((key) => key !== '_id').sort();
  assert.deepEqual([...schema.required].sort(), written, `${name}: required fields must equal the fields the mapper writes`);
  for (const key of written) assert.ok(key in schema.properties, `${name}.${key} has no type in the validator`);
}

describe('stored documents vs DB validators', () => {
  it('users', () => {
    const user = User.registerWithEmail({ id: 'aaaaaaaaaaaaaaaaaaaaaaaa', email: Email.of('a@b.co'), passwordHash: 'h', displayName: null, now: T0 });
    assertAligned('users', userMapper.toDocument(user));
  });

  it('sessions', () => {
    const session = Session.startFamily({
      id: 'bbbbbbbbbbbbbbbbbbbbbbbb',
      familyId: 'cccccccccccccccccccccccc',
      userId: 'dddddddddddddddddddddddd',
      tokenHash: hashOf('a'),
      clientType: 'IOS',
      rememberMe: false,
      now: T0,
      ttlSeconds: 60,
    });
    assertAligned('sessions', sessionMapper.toDocument(session));
  });
});
