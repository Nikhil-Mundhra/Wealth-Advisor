// Roles a user can hold; they travel in the access token and the /me response.
export const ROLES = ['USER', 'ADMIN'] as const;
export type Role = (typeof ROLES)[number];

export const ADMIN_ROLE: Role = 'ADMIN';
export const DEFAULT_ROLES: readonly Role[] = ['USER'];
