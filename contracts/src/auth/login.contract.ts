import { z } from 'zod';
import { ClientType } from '../common/client-type.contract.ts';

export const LoginRequest = z.object({
  email: z.string().trim().min(1).max(255),
  password: z.string().min(1).max(128),
  clientType: ClientType.default('WEB'),
  rememberMe: z.boolean().default(false),
});
export type LoginRequest = z.infer<typeof LoginRequest>;
