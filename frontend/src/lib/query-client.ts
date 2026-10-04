import { QueryClient } from '@tanstack/react-query';
import { ApiError, CLIENT_ERROR_CODES } from './api-error.ts';

// Client errors (4xx) and contract mismatches are answers, not outages; only network and 5xx failures are retried.
const isFinal = (error: unknown): boolean =>
  error instanceof ApiError && ((error.status >= 400 && error.status < 500) || error.code === CLIENT_ERROR_CODES.contractMismatch);

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => !isFinal(error) && failureCount < 2,
    },
    mutations: { retry: false },
  },
});
