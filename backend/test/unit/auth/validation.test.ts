import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { DomainError } from '#core/domain/domain-error.ts';
import { assertPasswordAllowed } from '#modules/auth/domain/policies/password.policy.ts';
import { Email } from '#modules/auth/domain/value-objects/email.vo.ts';

const code = (expected: string) => (error: unknown) => error instanceof DomainError && error.code === expected;

describe('Email rule (shared with the contract)', () => {
  it('normalizes input, then applies the shared pattern', () => {
    assert.equal(Email.of('  June@Example.COM ').value, 'june@example.com');
    assert.throws(() => Email.of('june@example'), code('AU_1006'));
  });

  it('tryParse returns null instead of throwing', () => {
    assert.equal(Email.tryParse('nope'), null);
    assert.equal(Email.tryParse('a@b.co')?.value, 'a@b.co');
  });

  it('restore skips the creation rule but still rejects non-addresses as corruption', () => {
    assert.equal(Email.restore('legacy@localhost').value, 'legacy@localhost');
    assert.throws(() => Email.restore('not-an-address'), code('AU_1900'));
  });
});

describe('password policy', () => {
  it('applies to every writer, not only the HTTP contract', () => {
    assert.throws(() => assertPasswordAllowed('short'), code('AU_1007'));
    assert.throws(() => assertPasswordAllowed('x'.repeat(129)), code('AU_1007'));
    assert.doesNotThrow(() => assertPasswordAllowed('long-enough'));
  });
});
