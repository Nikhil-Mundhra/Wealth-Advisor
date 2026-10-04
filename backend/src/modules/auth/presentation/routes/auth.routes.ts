import { LoginRequest, LogoutRequest, RefreshRequest, SignupRequest, SignupResponse, TokenPairResponse } from '@wealth-advisor/contracts';
import { RouteBuilder, type RouteDefinition } from '#core/http/route-builder.ts';
import type { AccessTokenSignerPort } from '../../application/ports/access-token-signer.port.ts';
import type { LoginUseCase } from '../../application/use-cases/login.use-case.ts';
import type { LogoutUseCase } from '../../application/use-cases/logout.use-case.ts';
import type { RefreshTokensUseCase } from '../../application/use-cases/refresh-tokens.use-case.ts';
import type { SignupUseCase } from '../../application/use-cases/signup.use-case.ts';
import { AuthErrors } from '../../domain/errors/auth-errors.ts';
import { clearRefreshCookie, readRefreshCookie } from '../cookies/refresh-cookie.ts';
import { deliverTokens } from '../delivery/token-delivery.ts';
import { toLoginCommand, toSignupCommand } from '../mappers/contract-to-command.mapper.ts';
import { toSignupResponse } from '../mappers/result-to-contract.mapper.ts';
import { getPrincipal, requireAuth } from '../middleware/require-auth.ts';

export interface AuthRouteDeps {
  readonly signup: SignupUseCase;
  readonly login: LoginUseCase;
  readonly refresh: RefreshTokensUseCase;
  readonly logout: LogoutUseCase;
  readonly signer: AccessTokenSignerPort;
}

// HTTP surface of the auth module. The cookie is checked before the body, as in cochika.
export function authRoutes(deps: AuthRouteDeps): RouteDefinition[] {
  const authenticated = requireAuth(deps.signer);

  return [
    RouteBuilder.post('/signup')
      .body(SignupRequest)
      .responds(SignupResponse, 201)
      .handle(async ({ body }) => toSignupResponse(await deps.signup.execute(toSignupCommand(body)))),

    RouteBuilder.post('/login')
      .body(LoginRequest)
      .responds(TokenPairResponse)
      .handle(async ({ c, body }) => deliverTokens(c, await deps.login.execute(toLoginCommand(body)))),

    RouteBuilder.post('/refresh')
      .body(RefreshRequest)
      .responds(TokenPairResponse)
      .handle(async ({ c, body }) => {
        const refreshToken = readRefreshCookie(c) ?? body.refreshToken;
        if (!refreshToken) throw AuthErrors.invalidRefreshToken();
        return deliverTokens(c, await deps.refresh.execute({ refreshToken }));
      }),

    RouteBuilder.post('/logout')
      .use(authenticated)
      .body(LogoutRequest)
      .handle(async ({ c, body }) => {
        const refreshToken = readRefreshCookie(c) ?? body.refreshToken;
        if (refreshToken) await deps.logout.execute({ kind: 'SESSION', userId: getPrincipal(c).userId, refreshToken });
        clearRefreshCookie(c);
      }),

    RouteBuilder.post('/logout-all')
      .use(authenticated)
      .handle(async ({ c }) => {
        await deps.logout.execute({ kind: 'ALL', userId: getPrincipal(c).userId });
        clearRefreshCookie(c);
      }),
  ];
}
