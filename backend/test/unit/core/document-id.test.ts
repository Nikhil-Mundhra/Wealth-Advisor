import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { toDocumentId, toScopeId } from '#core/db/document-id.ts';

const TENANT = '6000000000000000000000aa';
const USER = '5000000000000000000000bb';

describe('toDocumentId', () => {
  it('resolves a 24-character hex id', () => {
    assert.equal(toDocumentId(TENANT)?.toHexString(), TENANT);
  });

  it('refuses anything else, including the 12-byte form ObjectId.isValid accepts', () => {
    for (const id of ['', 'default', 'not-an-id', TENANT.slice(0, 12), `${TENANT}00`, '12345678901234567890123x']) {
      assert.equal(toDocumentId(id), null, id);
    }
  });
});

describe('toScopeId', () => {
  it('maps the demo scope key to the demo id it stands for', () => {
    assert.equal(toScopeId('default', TENANT)?.toHexString(), TENANT);
    assert.equal(toScopeId('default', USER)?.toHexString(), USER);
  });

  it('passes a real id through and refuses an unusable one', () => {
    assert.equal(toScopeId(USER, TENANT)?.toHexString(), USER);
    assert.equal(toScopeId('nonsense', TENANT), null);
  });
});