import { strict as assert } from 'node:assert';
import { after, before, describe, it } from 'node:test';
import { startTestApp, type TestApp } from '../../support/test-app.ts';

describe('Security headers middleware', () => {
  let app: TestApp;

  before(async () => {
    app = await startTestApp({ store: 'memory' });
  });

  after(async () => {
    await app.stop();
  });

  it('includes security headers on responses', async () => {
    const res = await app.app.request('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(res.headers.get('x-frame-options'), 'DENY');
    assert.equal(res.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
    const csp = res.headers.get('content-security-policy');
    assert.ok(csp, 'CSP header should be present');
    assert.ok(csp.includes("default-src 'self'"), 'CSP should include default-src self');
  });

  it('sets CORS headers on api routes', async () => {
    const res = await app.app.request('/api/health', {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET',
      },
    });
    assert.equal(res.headers.get('access-control-allow-origin'), 'http://localhost:3000');
    assert.equal(res.headers.get('access-control-allow-credentials'), 'true');
  });
});
