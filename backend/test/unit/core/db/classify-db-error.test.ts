import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { MongoNetworkError, MongoServerError } from 'mongodb';
import { classifyDbError } from '#core/db/errors/classify-db-error.ts';

describe('classifyDbError', () => {
  it('sorts driver errors into duplicate-key, transient and fatal', () => {
    assert.equal(classifyDbError(new MongoServerError({ code: 11000, errmsg: 'dup' })), 'duplicate-key');
    assert.equal(classifyDbError(new MongoNetworkError('reset')), 'transient');
    assert.equal(classifyDbError(new MongoServerError({ code: 121, errmsg: 'validation' })), 'fatal');
    assert.equal(classifyDbError(new Error('anything else')), 'fatal');
  });
});
