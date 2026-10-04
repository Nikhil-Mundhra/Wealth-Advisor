import { z } from 'zod';
import { RefreshTokenField } from '../fields/refresh-token.field.ts';

// Web clients send the refresh token as a cookie; mobile clients send it here.
export const LogoutRequest = z.object({
  refreshToken: RefreshTokenField.optional(),
});
export type LogoutRequest = z.infer<typeof LogoutRequest>;
