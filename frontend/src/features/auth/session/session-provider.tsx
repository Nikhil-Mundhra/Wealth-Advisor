import { type ReactNode, useEffect } from 'react';
import { setAuthHandlers } from '../../../lib/api-client.ts';
import { getAccessToken, refreshSession } from './session-store.ts';

// Connects the API client to the session and restores the session from the refresh cookie on load.
export function SessionProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    setAuthHandlers({ getAccessToken, refreshAccessToken: refreshSession });
    void refreshSession();
    return () => setAuthHandlers(null);
  }, []);
  return children;
}
