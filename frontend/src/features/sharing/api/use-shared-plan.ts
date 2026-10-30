import { useQuery } from '@tanstack/react-query';
import { sharingApi } from './sharing-api.ts';

export const sharedPlanQueryKey = (token: string) => ['sharing', 'plan', token] as const;

// Reads one shared plan by token; privacy masking is applied server-side.
export function useSharedPlan(token: string | undefined, enabled = true) {
  return useQuery({
    queryKey: sharedPlanQueryKey(token ?? ''),
    queryFn: () => sharingApi.get(token as string),
    enabled: enabled && Boolean(token),
    retry: 1,
    staleTime: 30_000,
  });
}
