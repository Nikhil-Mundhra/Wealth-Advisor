import { useMutation, useQueryClient } from '@tanstack/react-query';
import { setAccessToken } from '../session/session-store.ts';
import { authApi } from './auth-api.ts';
import { ME_QUERY_KEY } from './use-me.ts';

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (tokens) => {
      setAccessToken(tokens.accessToken);
      void queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
    },
  });
}
