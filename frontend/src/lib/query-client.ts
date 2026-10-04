import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './api-error.ts';

// Client errors (4xx) are answers, not outages, so only network and 5xx failures are retried.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => !(error instanceof ApiError && error.status >= 400 && error.status < 500) && failureCount < 2,
    },
    mutations: { retry: false },
  },
});
