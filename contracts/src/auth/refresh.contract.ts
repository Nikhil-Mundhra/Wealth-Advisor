import { z } from 'zod';
import { RefreshTokenField } from '../fields/refresh-token.field.ts';

// Web clients send the refresh token as a cookie and leave the body empty; mobile clients send it here.
export const RefreshRequest = z.object({
  refreshToken: RefreshTokenField.optional(),
});
export type RefreshRequest = z.infer<typeof RefreshRequest>;
