// Roles a user can hold. A const tuple + union instead of an enum, which Node's type stripping cannot parse.
export const ROLES = ['USER', 'ADMIN'] as const;
export type Role = (typeof ROLES)[number];

export const DEFAULT_ROLES: readonly Role[] = ['USER'];

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}
