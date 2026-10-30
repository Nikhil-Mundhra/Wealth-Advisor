import { AdvisoryChatRequest, AdvisoryChatResponse } from '@wealth-advisor/contracts';
import { apiRequest } from '../../../lib/api-client.ts';

// The advisory copilot endpoint, typed by contracts.
export const advisoryApi = {
  chat: (body: AdvisoryChatRequest) =>
    apiRequest('/advisory/chat', {
      method: 'POST',
      body,
      response: AdvisoryChatResponse,
      authenticated: true,
    }),
};
