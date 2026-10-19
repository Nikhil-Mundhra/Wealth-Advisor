import { getAccessToken, setAccessToken } from './session-store.ts';

const STORAGE_KEY_ADMIN_TOKEN = 'wealth_advisor_admin_acting_token';
const STORAGE_KEY_ADMIN_EMAIL = 'wealth_advisor_admin_acting_email';
const STORAGE_KEY_ACTING_INFO = 'wealth_advisor_admin_acting_info';

export interface ActingSessionInfo {
  id: string;
  name: string;
  email: string;
  roleBadge: string;
  category: 'ADMIN' | 'ADVISOR' | 'CLIENT';
}

export function saveAdminActingSession(
  adminToken: string,
  adminEmail: string,
  target: ActingSessionInfo
): void {
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY_ADMIN_TOKEN, adminToken);
    window.sessionStorage.setItem(STORAGE_KEY_ADMIN_EMAIL, adminEmail);
    window.sessionStorage.setItem(STORAGE_KEY_ACTING_INFO, JSON.stringify(target));
  } catch {
    // Ignore sessionStorage write issues
  }
}

export function getAdminActingSession(): ActingSessionInfo | null {
  if (typeof window === 'undefined' || !window.sessionStorage) return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY_ACTING_INFO);
    const token = window.sessionStorage.getItem(STORAGE_KEY_ADMIN_TOKEN);
    if (!raw || !token) return null;
    return JSON.parse(raw) as ActingSessionInfo;
  } catch {
    return null;
  }
}

export function returnToAdminSession(): boolean {
  if (typeof window === 'undefined' || !window.sessionStorage) return false;
  try {
    const savedToken = window.sessionStorage.getItem(STORAGE_KEY_ADMIN_TOKEN);
    if (!savedToken) return false;

    // Restore the admin access token to the active in-memory session store
    setAccessToken(savedToken);

    // Clear the acting session metadata
    window.sessionStorage.removeItem(STORAGE_KEY_ADMIN_TOKEN);
    window.sessionStorage.removeItem(STORAGE_KEY_ADMIN_EMAIL);
    window.sessionStorage.removeItem(STORAGE_KEY_ACTING_INFO);
    return true;
  } catch {
    return false;
  }
}

export function clearAdminActingSession(): void {
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY_ADMIN_TOKEN);
    window.sessionStorage.removeItem(STORAGE_KEY_ADMIN_EMAIL);
    window.sessionStorage.removeItem(STORAGE_KEY_ACTING_INFO);
  } catch {
    // Ignore
  }
}
