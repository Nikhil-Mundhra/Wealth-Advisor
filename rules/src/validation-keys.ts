// Stable ids for field validation failures. Contracts fail with these; clients turn them into text.
export const VALIDATION_KEYS = {
  emailRequired: 'email.required',
  emailInvalid: 'email.invalid',
  emailTooLong: 'email.too_long',
  passwordRequired: 'password.required',
  passwordTooShort: 'password.too_short',
  passwordTooLong: 'password.too_long',
  displayNameRequired: 'display_name.required',
  displayNameTooLong: 'display_name.too_long',
  clientTypeInvalid: 'client_type.invalid',
  refreshTokenInvalid: 'refresh_token.invalid',
} as const;

export type ValidationKey = (typeof VALIDATION_KEYS)[keyof typeof VALIDATION_KEYS];

export function isValidationKey(value: string): value is ValidationKey {
  return (Object.values(VALIDATION_KEYS) as string[]).includes(value);
}
