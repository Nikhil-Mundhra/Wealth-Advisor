// Every agent capability and API endpoint binds to one of these tiers.
export const PERMISSION_TIERS = ['TIER_0_READ', 'TIER_1_ADVISORY', 'TIER_2_SIMULATE', 'TIER_3_EXECUTE'] as const;
export type PermissionTier = (typeof PERMISSION_TIERS)[number];

export function isPermissionTier(value: string): value is PermissionTier {
  return (PERMISSION_TIERS as readonly string[]).includes(value);
}
