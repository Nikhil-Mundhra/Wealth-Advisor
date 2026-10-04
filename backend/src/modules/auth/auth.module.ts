import { ERROR_CODE_PREFIXES } from '@wealth-advisor/rules';
import { env } from '#core/config/env.ts';
import { defineModule, type ModuleManifest } from '#core/module/define-module.ts';
import type { ModuleContext } from '#core/module/module-context.ts';
import type { TokenConfig } from './application/config/token-config.ts';
import { GetMeUseCase } from './application/use-cases/get-me.use-case.ts';
import { TokenPairIssuer } from './application/use-cases/issue-token-pair.ts';
import { LoginUseCase } from './application/use-cases/login.use-case.ts';
import { LogoutUseCase } from './application/use-cases/logout.use-case.ts';
import { RefreshTokensUseCase } from './application/use-cases/refresh-tokens.use-case.ts';
import { SignupUseCase } from './application/use-cases/signup.use-case.ts';
import { ScryptPasswordHasher } from './infrastructure/crypto/scrypt-password-hasher.ts';
import { Ed25519JwtSigner } from './infrastructure/crypto/ed25519-jwt-signer.ts';
import { authCollections } from './infrastructure/persistence/auth.indexes.ts';
import { type SessionDocument, SESSIONS_COLLECTION } from './infrastructure/persistence/documents/session.document.ts';
import { type UserDocument, USERS_COLLECTION } from './infrastructure/persistence/documents/user.document.ts';
import { MongoSessionRepository } from './infrastructure/persistence/mongo-session.repository.ts';
import { MongoUserRepository } from './infrastructure/persistence/mongo-user.repository.ts';
import { AUTH_ERROR_STATUSES } from './presentation/auth-error-statuses.ts';
import { authRoutes } from './presentation/routes/auth.routes.ts';
import { meRoutes } from './presentation/routes/me.routes.ts';

// Composition root: the only file that knows which concrete class implements each port.
export function createAuthModule(context: ModuleContext): ModuleManifest {
  const { db, clock, ids, events } = context;
  const config = env();
  const tokenConfig: TokenConfig = {
    refreshTokenTtlSeconds: config.AUTH_REFRESH_TOKEN_TTL_SECONDS,
    reuseGraceSeconds: config.AUTH_REFRESH_REUSE_GRACE_SECONDS,
  };

  const users = new MongoUserRepository(async () => (await db()).collection<UserDocument>(USERS_COLLECTION), clock);
  const sessions = new MongoSessionRepository(async () => (await db()).collection<SessionDocument>(SESSIONS_COLLECTION), clock);
  const hasher = new ScryptPasswordHasher();
  const signer = new Ed25519JwtSigner({
    issuer: config.AUTH_JWT_ISSUER,
    audience: config.AUTH_JWT_AUDIENCE,
    keyId: config.AUTH_JWT_KEY_ID,
    ttlSeconds: config.AUTH_ACCESS_TOKEN_TTL_SECONDS,
    keys: {
      privateKeyPem: config.AUTH_JWT_PRIVATE_KEY,
      publicKeyPem: config.AUTH_JWT_PUBLIC_KEY,
      allowEphemeral: config.NODE_ENV !== 'production',
    },
    clock,
  });
  const issuer = new TokenPairIssuer({ sessions, signer });

  return defineModule({
    name: 'auth',
    basePath: '/auth',
    collections: authCollections,
    errors: { prefix: ERROR_CODE_PREFIXES.auth, statuses: AUTH_ERROR_STATUSES },
    routes: [
      ...authRoutes({
        signup: new SignupUseCase({ users, hasher, ids, clock, events }),
        login: new LoginUseCase({ users, hasher, issuer, ids, clock, config: tokenConfig }),
        refresh: new RefreshTokensUseCase({ users, sessions, issuer, ids, clock, config: tokenConfig }),
        logout: new LogoutUseCase({ sessions, clock }),
        signer,
      }),
      ...meRoutes({ getMe: new GetMeUseCase({ users }), signer }),
    ],
  });
}
