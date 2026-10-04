import { MeResponse } from '@wealth-advisor/contracts';
import { RouteBuilder, type RouteDefinition } from '#core/http/route-builder.ts';
import type { AccessTokenSignerPort } from '../../application/ports/access-token-signer.port.ts';
import type { GetMeUseCase } from '../../application/use-cases/get-me.use-case.ts';
import { toMeResponse } from '../mappers/result-to-contract.mapper.ts';
import { getPrincipal, requireAuth } from '../middleware/require-auth.ts';

export interface MeRouteDeps {
  readonly getMe: GetMeUseCase;
  readonly signer: AccessTokenSignerPort;
}

export function meRoutes(deps: MeRouteDeps): RouteDefinition[] {
  return [
    RouteBuilder.get('/me')
      .use(requireAuth(deps.signer))
      .responds(MeResponse)
      .handle(async ({ c }) => toMeResponse(await deps.getMe.execute({ userId: getPrincipal(c).userId }))),
  ];
}
