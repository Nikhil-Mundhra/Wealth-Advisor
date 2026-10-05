import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { ErrorCatalog } from '#core/errors/error-catalog.ts';

describe('ErrorCatalog', () => {
  it('maps registered codes and defaults unknown ones to 500', () => {
    const catalog = new ErrorCatalog().register('AU', { AU_1001: 409 });
    assert.equal(catalog.statusOf('AU_1001'), 409);
    assert.equal(catalog.statusOf('AU_9999'), 500);
  });

  it('rejects a code outside its prefix, a duplicate code and a duplicate prefix', () => {
    assert.throws(() => new ErrorCatalog().register('AU', { XX_1: 400 }), /outside prefix/);
    assert.throws(() => new ErrorCatalog().register('AU', { AU_1: 400 }).register('AU', { AU_2: 400 }), /registered twice/);
  });
});
