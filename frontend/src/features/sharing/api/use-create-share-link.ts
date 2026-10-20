import { useMutation } from '@tanstack/react-query';
import type { CreateShareLinkResponse } from '@wealth-advisor/contracts';
import { sharingApi } from './sharing-api.ts';

export const CREATE_SHARE_LINK_KEY = ['sharing', 'create'] as const;

// Issues a read-only share URL for the current rebalance proposal.
export function useCreateShareLink() {
  return useMutation<CreateShareLinkResponse, Error, Parameters<typeof sharingApi.create>[0]>({
    mutationKey: CREATE_SHARE_LINK_KEY,
    mutationFn: (body) => sharingApi.create(body),
  });
}
