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
  currencyInvalid: 'currency.invalid',
  dateInvalid: 'date.invalid',
  householdModeInvalid: 'household_mode.invalid',
  profilingAgeInvalid: 'profiling.age_invalid',
  profilingResidenceRequired: 'profiling.residence_required',
  profilingPsychologyRequired: 'profiling.psychology_required',
  profilingInstrumentsRequired: 'profiling.instruments_required',
  profilingStressRequired: 'profiling.stress_required',
  profilingAmountNegative: 'profiling.amount_negative',
} as const;

export type ValidationKey = (typeof VALIDATION_KEYS)[keyof typeof VALIDATION_KEYS];

export function isValidationKey(value: string): value is ValidationKey {
  return (Object.values(VALIDATION_KEYS) as string[]).includes(value);
}
