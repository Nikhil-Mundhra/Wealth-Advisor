import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clearSession } from '../session/session-store.ts';
import { authApi } from './auth-api.ts';

// The local session ends even if the server call fails; the user asked to leave.
export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      clearSession();
      queryClient.clear();
    },
  });
}
