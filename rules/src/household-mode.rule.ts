// Individual vs joint-household profiling drives the reserve target and risk capacity.
// Source: OECD Family Database (2021) and Vanguard Life-Cycle Research (2019) on dependent liability pooling.
export const HOUSEHOLD_RESERVE_MULTIPLIER: Record<HouseholdMode, number> = {
  INDIVIDUAL: 1.0,
  FAMILY_HOUSEHOLD: 2.0,
};

export const HOUSEHOLD_MODES = ['INDIVIDUAL', 'FAMILY_HOUSEHOLD'] as const;
export type HouseholdMode = (typeof HOUSEHOLD_MODES)[number];

export function isHouseholdMode(value: string): value is HouseholdMode {
  return (HOUSEHOLD_MODES as readonly string[]).includes(value);
}
