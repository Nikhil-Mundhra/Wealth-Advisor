import { z } from 'zod';
import { DisplayNameField } from '../fields/display-name.field.ts';
import { EmailField } from '../fields/email.field.ts';
import { NewPasswordField } from '../fields/password.field.ts';

export const SignupRequest = z.object({
  email: EmailField,
  password: NewPasswordField,
  displayName: DisplayNameField.optional(),
});
export type SignupRequest = z.infer<typeof SignupRequest>;

// Signup creates the account only; the client logs in afterwards to get tokens.
export const SignupResponse = z.object({
  userId: z.string(),
});
export type SignupResponse = z.infer<typeof SignupResponse>;
