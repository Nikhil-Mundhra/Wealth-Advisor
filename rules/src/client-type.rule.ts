// Which client is calling; decides whether the refresh token travels in a cookie (WEB) or the body.
export const CLIENT_TYPES = ['WEB', 'IOS', 'ANDROID'] as const;
export type ClientType = (typeof CLIENT_TYPES)[number];

export function isClientType(value: string): value is ClientType {
  return (CLIENT_TYPES as readonly string[]).includes(value);
}
