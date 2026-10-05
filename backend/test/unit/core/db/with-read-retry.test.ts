import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { MongoNetworkError, MongoServerError } from 'mongodb';
import { READ_RETRY } from '#core/db/retry/retry-policy.ts';
import { withReadRetry } from '#core/db/retry/with-read-retry.ts';

function failing(errors: Error[]) {
  let calls = 0;
  const operation = async () => {
    const error = errors[calls];
    calls += 1;
    if (error) throw error;
    return 'ok';
  };
  return { operation, calls: () => calls };
}

describe('withReadRetry', () => {
  it('retries a transient failure, up to the policy', async () => {
    const once = failing([new MongoNetworkError('reset')]);
    assert.equal(await withReadRetry(once.operation), 'ok');
    assert.equal(once.calls(), 2);

    const always = failing(Array.from({ length: 5 }, () => new MongoNetworkError('reset')));
    await assert.rejects(withReadRetry(always.operation), MongoNetworkError);
    assert.equal(always.calls(), READ_RETRY.attempts);
  });

  it('does not retry a non-transient failure', async () => {
    const fatal = failing([new MongoServerError({ code: 121, errmsg: 'validation' })]);
    await assert.rejects(withReadRetry(fatal.operation), MongoServerError);
    assert.equal(fatal.calls(), 1);
  });
});
