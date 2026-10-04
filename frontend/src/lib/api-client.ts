import type { z } from 'zod';
import { ApiError, NETWORK_ERROR_CODE } from './api-error.ts';

export interface AuthHandlers {
  getAccessToken(): string | null;
  refreshAccessToken(): Promise<boolean>;
}

// Registered by the auth feature at startup, so this module never imports from features/.
let authHandlers: AuthHandlers | null = null;

export function setAuthHandlers(handlers: AuthHandlers | null): void {
  authHandlers = handlers;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  authenticated?: boolean;
}

// Calls /api<path>. Responses are validated against their contract; errors become ApiError.
// An authenticated call that gets 401 refreshes the access token once and retries.
export async function apiRequest<S extends z.ZodType>(path: string, options: RequestOptions & { response: S }): Promise<z.output<S>>;
export async function apiRequest(path: string, options?: RequestOptions): Promise<void>;
export async function apiRequest(path: string, options: RequestOptions & { response?: z.ZodType } = {}): Promise<unknown> {
  let response = await send(path, options);
  if (response.status === 401 && options.authenticated && authHandlers && (await authHandlers.refreshAccessToken())) {
    response = await send(path, options);
  }
  if (!response.ok) throw await ApiError.fromResponse(response);
  return options.response ? options.response.parse(await response.json()) : undefined;
}

async function send(path: string, options: RequestOptions): Promise<Response> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers['content-type'] = 'application/json';
  const token = options.authenticated ? authHandlers?.getAccessToken() : null;
  if (token) headers.authorization = `Bearer ${token}`;
  try {
    return await fetch(`/api${path}`, {
      method: options.method ?? 'GET',
      headers,
      credentials: 'same-origin',
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError(0, NETWORK_ERROR_CODE, "can't reach the server");
  }
}
