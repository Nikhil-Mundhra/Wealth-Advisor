import { Hono } from 'hono';
import { logger } from 'hono/logger';

// Vercel entrypoint: Vercel imports this default export and runs it as a function.
// Local Node runs it through node-server.ts instead.
const app = new Hono();
app.use(logger());

const api = new Hono();
api.get('/health', (c) => c.json({ status: 'ok' }));
// Placeholder until an AI feature exists.
api.all('/ai', (c) => c.json({ message: 'oops no ai yet bitch' }, 501));
// A mounted sub-app's notFound never fires, so catch unmatched /api/* here.
api.all('*', (c) => c.json({ error: 'not found' }, 404));
app.route('/api', api);

export default app;
