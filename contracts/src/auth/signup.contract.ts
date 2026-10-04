import { z } from 'zod';

export const SignupRequest = z.object({
  email: z.email({ error: 'Enter a valid email address.' }).max(255, { error: 'Email must be 255 characters or fewer.' }),
  password: z.string().min(8, { error: 'Use at least 8 characters.' }).max(128, { error: 'Use 128 characters or fewer.' }),
  displayName: z.string().trim().min(1).max(64, { error: 'Use 64 characters or fewer.' }).optional(),
});
export type SignupRequest = z.infer<typeof SignupRequest>;

// Signup creates the account only; the client logs in afterwards to get tokens.
export const SignupResponse = z.object({
  userId: z.string(),
});
export type SignupResponse = z.infer<typeof SignupResponse>;
