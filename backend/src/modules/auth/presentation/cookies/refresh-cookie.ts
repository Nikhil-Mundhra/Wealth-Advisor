import type { Context } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';

const NAME = 'refresh_token';
const PATH = '/api/auth'; // the browser sends it only to auth endpoints

interface RefreshCookieOptions {
  readonly rememberMe: boolean;
  readonly expiresAt: Date;
}

const REFRESH_COOKIE_BASE_OPTIONS = {
  path: PATH,
  secure: true,
  httpOnly: true,
  sameSite: 'Lax' as const,
};

// Without rememberMe the cookie is a session cookie (gone when the browser closes); the server-side
// session still lives 14 days either way.
export function setRefreshCookie(c: Context, token: string, options: RefreshCookieOptions): void {
  setCookie(c, NAME, token, {
    ...REFRESH_COOKIE_BASE_OPTIONS,
    ...(options.rememberMe ? { expires: options.expiresAt } : {}),
  });
}

export function readRefreshCookie(c: Context): string | undefined {
  return getCookie(c, NAME) || undefined;
}

export function clearRefreshCookie(c: Context): void {
  deleteCookie(c, NAME, REFRESH_COOKIE_BASE_OPTIONS);
}

