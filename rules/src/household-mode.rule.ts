// Individual vs joint-household profiling drives the reserve target and risk capacity.
export const HOUSEHOLD_MODES = ['INDIVIDUAL', 'FAMILY_HOUSEHOLD'] as const;
export type HouseholdMode = (typeof HOUSEHOLD_MODES)[number];

export function isHouseholdMode(value: string): value is HouseholdMode {
  return (HOUSEHOLD_MODES as readonly string[]).includes(value);
}
