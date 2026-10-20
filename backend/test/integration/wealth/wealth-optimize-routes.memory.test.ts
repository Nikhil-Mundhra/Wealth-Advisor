import { strict as assert } from 'node:assert';
import { after, before, describe, it } from 'node:test';
import { type TestApp, postJson, startTestApp } from '../../support/test-app.ts';

const json = async (response: Response) => (await response.json()) as Record<string, unknown>;

// POST /wealth/optimize takes an optional body and threads it into the recalibration, so the FX-mismatch
// penalty leg is reachable through the route instead of only through the API.
describe('wealth optimize routes', () => {
  let app: TestApp;

  before(async () => {
    app = await startTestApp({ store: 'memory' });
  });
  after(async () => {
    await app.stop();
  });

  it('recalibrates the seeded portfolio from a bodyless call', async () => {
    const response = await postJson(app.app, '/api/wealth/optimize', {});
    assert.equal(response.status, 200);
    assert.equal((await json(response)).effectiveRiskScore, 6.0);
    const stored = await app.app.request('/api/wealth/portfolio');
    assert.equal(stored.status, 200);
    assert.equal(((await stored.json()) as Record<string, unknown>).effectiveRiskScore, 6.0);
  });

  it('applies the FX penalty from the request body', async () => {
    const response = await postJson(app.app, '/api/wealth/optimize', {
      householdMode: 'FAMILY_HOUSEHOLD',
      fxMismatchPct: 40,
    });
    assert.equal(response.status, 200);
    assert.equal((await json(response)).effectiveRiskScore, 5.0);
  });
});
