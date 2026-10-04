import { strict as assert } from 'node:assert';
import { after, before, it } from 'node:test';
import { type TestApp, postJson, startTestApp } from '../../support/test-app.ts';

let t: TestApp;
before(async () => {
  t = await startTestApp();
  await postJson(t.app, '/api/auth/signup', { email: 'racer@example.com', password: 'correct-horse-battery' });
});
after(async () => {
  await t.stop();
});

it('two concurrent refreshes of the same token: exactly one rotates, the other gets 409', async () => {
  const login = (await (await postJson(t.app, '/api/auth/login', { email: 'racer@example.com', password: 'correct-horse-battery', clientType: 'IOS' })).json()) as {
    refreshToken: string;
  };
  const responses = await Promise.all(Array.from({ length: 5 }, () => postJson(t.app, '/api/auth/refresh', { refreshToken: login.refreshToken })));
  const statuses = responses.map((response) => response.status).sort();
  assert.deepEqual(statuses, [200, 409, 409, 409, 409]);
});
