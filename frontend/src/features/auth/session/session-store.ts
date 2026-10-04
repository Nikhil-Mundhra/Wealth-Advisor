import { authApi } from '../api/auth-api.ts';

export type SessionStatus = 'loading' | 'authenticated' | 'anonymous';

// The access token lives only in memory, never in localStorage, so injected scripts cannot read it later.
// A reload restores it through the HttpOnly refresh cookie (refreshSession).
let accessToken: string | null = null;
let initialized = false;
let refreshing: Promise<boolean> | null = null;
const listeners = new Set<() => void>();

const notify = (): void => listeners.forEach((listener) => listener());

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string): void {
  accessToken = token;
  initialized = true;
  notify();
}

export function clearSession(): void {
  accessToken = null;
  initialized = true;
  notify();
}

export function getSessionStatus(): SessionStatus {
  if (!initialized) return 'loading';
  return accessToken ? 'authenticated' : 'anonymous';
}

export function subscribeToSession(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Single-flight: concurrent callers share one request. Two parallel refreshes with the same cookie would make
// the server see a rotated token reused, so there must never be two in flight.
export function refreshSession(): Promise<boolean> {
  refreshing ??= authApi
    .refresh()
    .then((tokens) => {
      setAccessToken(tokens.accessToken);
      return true;
    })
    .catch(() => {
      clearSession();
      return false;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}
