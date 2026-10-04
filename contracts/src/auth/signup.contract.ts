import { z } from 'zod';

export const SignupRequest = z.object({
  email: z.email().max(255),
  password: z.string().min(8).max(128),
  displayName: z.string().trim().min(1).max(64).optional(),
});
export type SignupRequest = z.infer<typeof SignupRequest>;

// Signup creates the account only; the client logs in afterwards to get tokens.
export const SignupResponse = z.object({
  userId: z.string(),
});
export type SignupResponse = z.infer<typeof SignupResponse>;
