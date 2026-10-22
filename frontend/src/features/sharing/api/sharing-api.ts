import {
  CreateShareLinkRequest,
  CreateShareLinkResponse,
  ListSharedPlansResponse,
  RevokeShareLinkResponse,
  SharedPlanResponse,
} from '@wealth-advisor/contracts';
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

  list: (clientId?: string) =>
    apiRequest(clientId ? `/sharing/links?clientId=${encodeURIComponent(clientId)}` : '/sharing/links', {
      method: 'GET',
      response: ListSharedPlansResponse,
      authenticated: true,
    }),

  revoke: (token: string) =>
    apiRequest(`/sharing/${encodeURIComponent(token)}`, {
      method: 'DELETE',
      response: RevokeShareLinkResponse,
      authenticated: true,
    }),

  get: (token: string) =>
    apiRequest(`/sharing/${encodeURIComponent(token)}`, {
      response: SharedPlanResponse,
    }),
};
