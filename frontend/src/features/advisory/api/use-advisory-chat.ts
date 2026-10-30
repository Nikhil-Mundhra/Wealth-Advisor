import { useMutation } from '@tanstack/react-query';
import type { AdvisoryChatResponse } from '@wealth-advisor/contracts';
import { advisoryApi } from './advisory-api.ts';

export const ADVISORY_CHAT_KEY = ['advisory', 'chat'] as const;

// Sends one copilot turn to the backend gateway; the reply, three-pillar
// rationale and action cards all come from the API, never seeded state.
export function useAdvisoryChat() {
  return useMutation<AdvisoryChatResponse, Error, Parameters<typeof advisoryApi.chat>[0]>({
    mutationKey: ADVISORY_CHAT_KEY,
    mutationFn: (body) => advisoryApi.chat(body),
  });
}
