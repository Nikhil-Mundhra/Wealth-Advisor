export const DISPLAY_NAME_MAX_LENGTH = 64;

export function normalizeDisplayName(raw: string): string {
  return raw.trim();
}

// Expects a normalized display name.
export function isDisplayName(name: string): boolean {
  return name.length >= 1 && name.length <= DISPLAY_NAME_MAX_LENGTH;
}
