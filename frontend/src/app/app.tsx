import { RouterProvider } from 'react-router';
import { Analytics } from '@vercel/analytics/react';
import { Providers } from './providers.tsx';
import { router } from './router.tsx';

export function App() {
  return (
    <Providers>
      <RouterProvider router={router} />
      <Analytics />
    </Providers>
  );
}
