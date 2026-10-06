import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clearSession } from '../session/session-store.ts';
import { authApi } from './auth-api.ts';

// Deletes the account on the server, then clears the in-memory session and query cache.
export function useDeleteAccount(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.deleteAccount,
    onSuccess: () => {
      onSuccessCallback?.();
      clearSession();
      queryClient.clear();
    },
  });
}
