import { z } from 'zod';

// refreshToken is present only for mobile clients; web clients receive it as an HttpOnly cookie instead.
export const TokenPairResponse = z.object({
  accessToken: z.string(),
  tokenType: z.literal('Bearer'),
  expiresIn: z.number().int().positive(),
  refreshToken: z.string().optional(),
});
export type TokenPairResponse = z.infer<typeof TokenPairResponse>;
