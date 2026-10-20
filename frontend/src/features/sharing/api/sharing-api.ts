import { CreateShareLinkRequest, CreateShareLinkResponse, SharedPlanResponse } from '@wealth-advisor/contracts';
import type { z } from 'zod';
import { apiRequest } from '../../../lib/api-client.ts';

// Shareable plan links, typed by contracts.
export const sharingApi = {
  create: (body: z.infer<typeof CreateShareLinkRequest>) =>
    apiRequest('/sharing/create', {
      method: 'POST',
      body,
      response: CreateShareLinkResponse,
      authenticated: true,
    }),

  get: (token: string) =>
    apiRequest(`/sharing/${encodeURIComponent(token)}`, {
      response: SharedPlanResponse,
    }),
};
