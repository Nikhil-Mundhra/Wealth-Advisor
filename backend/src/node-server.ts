import { fileURLToPath } from 'node:url';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import app from './app.ts';

// Local-only runner (make backend / make prod). Not used on Vercel.
const PORT = Number(process.env.PORT ?? 3000);
const isProduction = process.env.NODE_ENV === 'production';

// serveStatic resolves `root` against the process cwd, so compute it from this file instead.
const frontendDist = fileURLToPath(new URL('../../frontend/dist', import.meta.url));

// In production-like local runs, serve the built SPA after the /api routes already on `app`.
if (isProduction) {
  app.use('/*', serveStatic({ root: frontendDist }));
  app.get('*', serveStatic({ root: frontendDist, path: 'index.html' }));
}

serve({ fetch: app.fetch, port: PORT }, ({ port }) => {
  console.log(`backend listening on http://localhost:${port} (${isProduction ? 'production' : 'dev'})`);
});
