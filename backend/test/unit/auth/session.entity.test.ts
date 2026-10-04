import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { DomainError } from '#core/domain/domain-error.ts';
import { Session } from '#modules/auth/domain/entities/session.entity.ts';
import { Email } from '#modules/auth/domain/value-objects/email.vo.ts';
import { T0, activeSession, hashOf, secondsAfter } from '../../support/auth-fixtures.ts';

const isInvariantViolation = (error: unknown): boolean => error instanceof DomainError && error.code === 'AU_1900';

describe('Session', () => {
  it('rotation revokes the parent and keeps the family on the child with a fresh expiry', () => {
    const parent = activeSession();
    const now = secondsAfter(T0, 3600);
    const child = parent.rotate({ childId: 'session-2', childTokenHash: hashOf('b'), now, ttlSeconds: 120 });

    assert.equal(parent.revokeReason, 'ROTATED');
    assert.equal(parent.toSnapshot().replacedBy, 'session-2');
    assert.equal(child.familyId, parent.familyId);
    assert.equal(child.clientType, parent.clientType);
    assert.deepEqual(child.expiresAt, secondsAfter(now, 120));
    assert.equal(child.isActive(now), true);
  });

  it('first revoke wins', () => {
    const session = activeSession();
    assert.equal(session.revoke('LOGOUT', secondsAfter(T0, 1)), true);
    assert.equal(session.revoke('LOGOUT_ALL', secondsAfter(T0, 2)), false);
    assert.equal(session.revokeReason, 'LOGOUT');
  });

  it('an inactive session cannot rotate', () => {
    const session = activeSession();
    session.revoke('LOGOUT', secondsAfter(T0, 1));
    assert.throws(
      () => session.rotate({ childId: 'x', childTokenHash: hashOf('b'), now: secondsAfter(T0, 2), ttlSeconds: 60 }),
      isInvariantViolation,
    );
  });

  it('postInit rejects inconsistent state on restore', () => {
    const valid = activeSession().toSnapshot();
    assert.throws(() => Session.restore({ ...valid, expiresAt: valid.issuedAt }), isInvariantViolation);
    assert.throws(() => Session.restore({ ...valid, revokedAt: T0 }), isInvariantViolation);
    assert.throws(() => Session.restore({ ...valid, replacedBy: 'other' }), isInvariantViolation);
  });
});

describe('Email', () => {
  it('normalizes and freezes', () => {
    const email = Email.of('  Jane.Doe@Example.COM ');
    assert.equal(email.value, 'jane.doe@example.com');
    assert.equal(Object.isFrozen(email), true);
    assert.equal(email.equals(Email.of('jane.doe@example.com')), true);
  });

  it('rejects malformed input', () => {
    assert.throws(() => Email.of('not-an-email'), (error: unknown) => error instanceof DomainError && error.code === 'AU_1006');
  });
});
