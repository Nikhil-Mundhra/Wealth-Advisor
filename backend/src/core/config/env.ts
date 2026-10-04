import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  MONGODB_URI: z.string().min(1).optional(),
  MONGODB_DB_NAME: z.string().min(1).default('wealth_advisor'),
  AUTH_JWT_ISSUER: z.string().min(1).default('wealth-advisor-auth'),
  AUTH_JWT_AUDIENCE: z.string().min(1).default('wealth-advisor-api'),
  AUTH_JWT_KEY_ID: z.string().min(1).default('wa-1'),
  AUTH_JWT_PRIVATE_KEY: z.string().min(1).optional(),
  AUTH_JWT_PUBLIC_KEY: z.string().min(1).optional(),
  AUTH_ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(15 * 60),
  AUTH_REFRESH_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(14 * 24 * 60 * 60),
  AUTH_REFRESH_REUSE_GRACE_SECONDS: z.coerce.number().int().nonnegative().default(5),
});

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | undefined;

// Parsed on first use rather than at import, so a bad variable fails the request that needs it with a clear message.
export function env(): Env {
  cached ??= EnvSchema.parse(process.env);
  return cached;
}
