import { MeResponse } from '@wealth-advisor/contracts';
import { RouteBuilder, type RouteDefinition } from '#core/http/route-builder.ts';
import type { AccessTokenSignerPort } from '../../application/ports/access-token-signer.port.ts';
import type { DeleteAccountUseCase } from '../../application/use-cases/delete-account.use-case.ts';
import type { GetMeUseCase } from '../../application/use-cases/get-me.use-case.ts';
import { clearRefreshCookie } from '../cookies/refresh-cookie.ts';
import { toMeResponse } from '../mappers/result-to-contract.mapper.ts';
import { getPrincipal, requireAuth } from '../middleware/require-auth.ts';

export interface MeRouteDeps {
  readonly getMe: GetMeUseCase;
  readonly deleteAccount: DeleteAccountUseCase;
  readonly signer: AccessTokenSignerPort;
}

export function meRoutes(deps: MeRouteDeps): RouteDefinition[] {
  const authenticated = requireAuth(deps.signer);
  return [
    RouteBuilder.get('/me')
      .use(authenticated)
      .responds(MeResponse)
      .handle(async ({ c }) => toMeResponse(await deps.getMe.execute({ userId: getPrincipal(c).userId }))),

    RouteBuilder.delete('/me')
      .use(authenticated)
      .handle(async ({ c }) => {
        await deps.deleteAccount.execute({ userId: getPrincipal(c).userId });
        clearRefreshCookie(c);
      }),
  ];
}
