import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { decideRotation } from '#modules/auth/domain/policies/refresh-rotation.policy.ts';
import { T0, activeSession, hashOf, secondsAfter } from '../../support/auth-fixtures.ts';

const GRACE = 5;

describe('decideRotation', () => {
  it('rejects an unknown token', () => {
    assert.deepEqual(decideRotation(null, T0, GRACE), { kind: 'INVALID' });
  });

  it('rotates an active session', () => {
    assert.deepEqual(decideRotation(activeSession(), secondsAfter(T0, 60), GRACE), { kind: 'ROTATE' });
  });

  it('rejects an expired session', () => {
    const session = activeSession({ ttlSeconds: 60 });
    assert.deepEqual(decideRotation(session, secondsAfter(T0, 61), GRACE), { kind: 'INVALID' });
  });

  it('rejects a session revoked for a reason other than rotation', () => {
    const session = activeSession();
    session.revoke('LOGOUT', secondsAfter(T0, 10));
    assert.deepEqual(decideRotation(session, secondsAfter(T0, 11), GRACE), { kind: 'INVALID' });
  });

  it('treats reuse within the grace window as a client retry', () => {
    const session = activeSession();
    const rotatedAt = secondsAfter(T0, 100);
    session.rotate({ childId: 'session-2', childTokenHash: hashOf('b'), now: rotatedAt, ttlSeconds: 60 });
    assert.deepEqual(decideRotation(session, secondsAfter(rotatedAt, GRACE), GRACE), { kind: 'ALREADY_ROTATED' });
  });

  it('treats reuse after the grace window as theft of the family', () => {
    const session = activeSession();
    const rotatedAt = secondsAfter(T0, 100);
    session.rotate({ childId: 'session-2', childTokenHash: hashOf('b'), now: rotatedAt, ttlSeconds: 60 });
    assert.deepEqual(decideRotation(session, secondsAfter(rotatedAt, GRACE + 1), GRACE), {
      kind: 'REUSE_DETECTED',
      familyId: 'family-1',
    });
  });
});
