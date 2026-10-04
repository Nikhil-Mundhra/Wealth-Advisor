import { z } from 'zod';
import { ClientType } from '../common/client-type.contract.ts';

export const LoginRequest = z.object({
  // Not format-checked on purpose: a malformed email is just another failed login (same 401, no hint).
  email: z.string().trim().min(1, { error: 'Enter your email address.' }).max(255),
  password: z.string().min(1, { error: 'Enter your password.' }).max(128),
  clientType: ClientType.default('WEB'),
  rememberMe: z.boolean().default(false),
});
export type LoginRequest = z.infer<typeof LoginRequest>;
