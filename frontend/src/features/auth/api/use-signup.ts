import { LoginRequest, type SignupRequest } from '@wealth-advisor/contracts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { setAccessToken } from '../session/session-store.ts';
import { authApi } from './auth-api.ts';
import { ME_QUERY_KEY } from './use-me.ts';

export type SignupOutcome = 'signed-in' | 'created';

// The API's signup only creates the account, so a successful signup logs in with the same credentials (contract
// defaults for the rest). If that login fails, the account still exists: report 'created', not an error.
export function useSignup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (request: SignupRequest): Promise<SignupOutcome> => {
      await authApi.signup(request);
      try {
        const tokens = await authApi.login(LoginRequest.parse({ email: request.email, password: request.password }));
        setAccessToken(tokens.accessToken);
        return 'signed-in';
      } catch {
        return 'created';
      }
    },
    onSuccess: (outcome) => {
      if (outcome === 'signed-in') void queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
    },
  });
}
