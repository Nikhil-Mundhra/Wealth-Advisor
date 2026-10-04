export const REFRESH_TOKEN_BYTES = 32;

// 32 random bytes as base64url without padding: always 43 characters.
export const REFRESH_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function isRefreshToken(value: string): boolean {
  return REFRESH_TOKEN_PATTERN.test(value);
}
