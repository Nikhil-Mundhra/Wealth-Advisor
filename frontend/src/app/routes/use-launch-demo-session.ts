import { useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import type { DemoPersona } from '../../features/admin/components/credentials-tab.tsx';
import { authApi } from '../../features/auth/api/auth-api.ts';
import { ME_QUERY_KEY, useMe } from '../../features/auth/api/use-me.ts';
import { saveAdminActingSession } from '../../features/auth/session/acting-session.ts';
import { getAccessToken, setAccessToken } from '../../features/auth/session/session-store.ts';

export function useLaunchDemoSession() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const me = useMe();

  return async (persona: DemoPersona): Promise<void> => {
    const currentToken = getAccessToken();
    const currentEmail = me.data?.email ?? 'Shenzhen@Fintechathon.com';

    // Save admin session state so the operator can return cleanly to /admin.
    if (currentToken) {
      saveAdminActingSession(currentToken, currentEmail, {
        id: persona.id,
        name: persona.name,
        email: persona.email,
        roleBadge: persona.roleBadge,
        category: persona.category,
      });
    }

    const tokens = await authApi.login({
      email: persona.email,
      password: persona.password,
      clientType: 'WEB',
      rememberMe: false,
    });

    setAccessToken(tokens.accessToken);
    await queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });

    if (persona.category === 'CLIENT') {
      navigate('/');
    } else if (persona.category === 'ADVISOR') {
      navigate('/advisor');
    } else {
      navigate('/admin');
    }
  };
}
