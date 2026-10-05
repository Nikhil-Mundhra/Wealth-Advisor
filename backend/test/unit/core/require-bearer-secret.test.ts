import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { Hono } from 'hono';
import { DomainError } from '#core/domain/domain-error.ts';
import { ErrorCatalog } from '#core/errors/error-catalog.ts';
import { createErrorHandler } from '#core/http/error-handler.ts';
import { requireBearerSecret } from '#core/http/require-bearer-secret.ts';

function appWith(secret: string | undefined) {
  const catalog = new ErrorCatalog();
  catalog.register('MK', { MK_1001: 401 });
  const app = new Hono();
  app.onError(createErrorHandler(catalog));
  app.get('/job', requireBearerSecret(() => secret, () => new DomainError('MK_1001', 'no')), (c) => c.text('ran'));
  return app;
}

describe('requireBearerSecret', () => {
  it('lets the exact bearer through', async () => {
    const response = await appWith('s3cret').request('/job', { headers: { authorization: 'Bearer s3cret' } });
    assert.equal(await response.text(), 'ran');
  });

  // Fetch Headers trim surrounding whitespace, so 'Bearer s3cret ' arrives as the exact bearer.
  it('rejects a wrong, extended, unprefixed or missing bearer', async () => {
    for (const authorization of ['Bearer s3cre', 'Bearer s3cret2', 'Bearer  s3cret', 's3cret', 'Basic s3cret', '']) {
      const response = await appWith('s3cret').request('/job', { headers: authorization ? { authorization } : {} });
      assert.equal(response.status, 401, authorization);
    }
  });

  it('rejects every call while the secret is unset, including an empty bearer', async () => {
    for (const secret of [undefined, '']) {
      for (const authorization of ['Bearer ', 'Bearer undefined']) {
        assert.equal((await appWith(secret).request('/job', { headers: { authorization } })).status, 401);
      }
    }
  });
});
