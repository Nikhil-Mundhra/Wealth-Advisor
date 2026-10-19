// Roles a user can hold; they travel in the access token and the /me response.
export const ROLES = ['USER', 'ADVISOR', 'ADMIN'] as const;
export type Role = (typeof ROLES)[number];

export const ADVISOR_ROLE: Role = 'ADVISOR';
export const ADMIN_ROLE: Role = 'ADMIN';
export const DEFAULT_ROLES: readonly Role[] = ['USER'];

export const USER_STATUSES = ['ACTIVE', 'WITHDRAWN'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export function hasAdvisorRole(roles: readonly string[]): boolean {
  return roles.includes('ADVISOR') || roles.includes('ADMIN');
}
