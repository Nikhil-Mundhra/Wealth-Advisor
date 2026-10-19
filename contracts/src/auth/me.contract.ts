import { z } from 'zod';

export const MeResponse = z.object({
  id: z.string(),
  email: z.string(),
  displayName: z.string().nullable(),
  roles: z.array(z.string()),
  emailVerified: z.boolean(),
  advisorId: z.string().nullable().optional(),
  createdAt: z.iso.datetime(),
});
export type MeResponse = z.infer<typeof MeResponse>;
