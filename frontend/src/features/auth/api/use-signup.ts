import type { SignupRequest } from '@wealth-advisor/contracts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { setAccessToken } from '../session/session-store.ts';
import { authApi } from './auth-api.ts';
import { ME_QUERY_KEY } from './use-me.ts';

// The API's signup only creates the account, so a successful signup logs in with the same credentials.
export function useSignup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (request: SignupRequest) => {
      await authApi.signup(request);
      return authApi.login({ email: request.email, password: request.password, clientType: 'WEB', rememberMe: false });
    },
    onSuccess: (tokens) => {
      setAccessToken(tokens.accessToken);
      void queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
    },
  });
}
