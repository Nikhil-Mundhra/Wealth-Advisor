import { z } from 'zod';
import { ClientTypeField } from '../fields/client-type.field.ts';
import { LoginEmailField } from '../fields/email.field.ts';
import { LoginPasswordField } from '../fields/password.field.ts';

export const LoginRequest = z.object({
  email: LoginEmailField,
  password: LoginPasswordField,
  clientType: ClientTypeField.default('WEB'),
  rememberMe: z.boolean().default(false),
});
export type LoginRequest = z.infer<typeof LoginRequest>;
