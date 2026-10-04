import { z } from 'zod';

// Web clients send the refresh token as a cookie and leave the body empty; mobile clients send it here.
export const RefreshRequest = z.object({
  refreshToken: z.string().min(1).optional(),
});
export type RefreshRequest = z.infer<typeof RefreshRequest>;

export const LogoutRequest = z.object({
  refreshToken: z.string().min(1).optional(),
});
export type LogoutRequest = z.infer<typeof LogoutRequest>;
