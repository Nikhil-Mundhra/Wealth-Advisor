import {
  AdvisorClientListResponse,
  AdvisorInviteDto,
  AdvisorInviteListResponse,
  ClientAdvisorProfileResponse,
  ConnectAdvisorRequest,
  CreateAdvisorInviteRequest,
  ListPasskeysResponse,
  MeResponse,
  PasskeyRegisterVerifyRequest,
  PasskeyRegistrationOptionsResponse,
  PasskeyStepUpVerifyResponse,
} from '@wealth-advisor/contracts';
import { RouteBuilder, type RouteDefinition } from '#core/http/route-builder.ts';
import type { AccessTokenSignerPort } from '../../application/ports/access-token-signer.port.ts';
import type { AdvisorInvitesUseCase } from '../../application/use-cases/advisor-invites.use-case.ts';
import type { ConnectAdvisorUseCase } from '../../application/use-cases/connect-advisor.use-case.ts';
import type { DeleteAccountUseCase } from '../../application/use-cases/delete-account.use-case.ts';
import type { GetConnectedAdvisorUseCase } from '../../application/use-cases/get-connected-advisor.use-case.ts';
import type { GetMeUseCase } from '../../application/use-cases/get-me.use-case.ts';
import type { ListAdvisorClientsUseCase } from '../../application/use-cases/list-advisor-clients.use-case.ts';
import type { PasskeyUseCase } from '../../application/use-cases/passkey.use-case.ts';
import { clearRefreshCookie } from '../cookies/refresh-cookie.ts';
import { toMeResponse } from '../mappers/result-to-contract.mapper.ts';
import { getPrincipal, requireAuth } from '../middleware/require-auth.ts';

export interface MeRouteDeps {
  readonly getMe: GetMeUseCase;
  readonly deleteAccount: DeleteAccountUseCase;
  readonly signer: AccessTokenSignerPort;
  readonly connectAdvisor?: ConnectAdvisorUseCase;
  readonly getConnectedAdvisor?: GetConnectedAdvisorUseCase;
  readonly listClients?: ListAdvisorClientsUseCase;
  readonly advisorInvites?: AdvisorInvitesUseCase;
  readonly passkeys?: PasskeyUseCase;
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

    RouteBuilder.post('/me/advisor')
      .use(authenticated)
      .body(ConnectAdvisorRequest)
      .responds(MeResponse)
      .handle(async ({ c, body }) => {
        if (!deps.connectAdvisor) throw new Error('connectAdvisor use case not configured');
        return toMeResponse(await deps.connectAdvisor.execute({ userId: getPrincipal(c).userId, inviteCode: body.inviteCode }));
      }),

    RouteBuilder.get('/me/advisor')
      .use(authenticated)
      .responds(ClientAdvisorProfileResponse)
      .handle(async ({ c }) => {
        if (!deps.getConnectedAdvisor) return null;
        return deps.getConnectedAdvisor.execute({ userId: getPrincipal(c).userId });
      }),

    RouteBuilder.get('/advisor/clients')
      .use(authenticated)
      .responds(AdvisorClientListResponse)
      .handle(async ({ c }) => {
        if (!deps.listClients) return { clients: [] };
        return deps.listClients.execute({ advisorId: getPrincipal(c).userId });
      }),

    RouteBuilder.get('/advisor/invites')
      .use(authenticated)
      .responds(AdvisorInviteListResponse)
      .handle(async ({ c }) => {
        if (!deps.advisorInvites) return { invites: [] };
        const origin = new URL(c.req.url).origin;
        return deps.advisorInvites.listInvites(getPrincipal(c).userId, origin);
      }),

    RouteBuilder.post('/advisor/invites')
      .use(authenticated)
      .body(CreateAdvisorInviteRequest)
      .responds(AdvisorInviteDto, 201)
      .handle(async ({ c, body }) => {
        if (!deps.advisorInvites) throw new Error('advisorInvites use case not configured');
        const origin = new URL(c.req.url).origin;
        return deps.advisorInvites.createInvite(getPrincipal(c).userId, body, origin);
      }),

    RouteBuilder.get('/passkeys/register/options')
      .use(authenticated)
      .responds(PasskeyRegistrationOptionsResponse)
      .handle(async ({ c }) => {
        if (!deps.passkeys) throw new Error('passkeys use case not configured');
        return deps.passkeys.getRegistrationOptions(getPrincipal(c).userId);
      }),

    RouteBuilder.post('/passkeys/register/verify')
      .use(authenticated)
      .body(PasskeyRegisterVerifyRequest)
      .responds(PasskeyStepUpVerifyResponse)
      .handle(async ({ c, body }) => {
        if (!deps.passkeys) throw new Error('passkeys use case not configured');
        const { userId, tenantId } = getPrincipal(c);
        const res = await deps.passkeys.verifyRegistration(userId, tenantId ?? 'default', body);
        return { verified: res.verified, assertionProof: body.credentialId };
      }),

    RouteBuilder.get('/passkeys')
      .use(authenticated)
      .responds(ListPasskeysResponse)
      .handle(async ({ c }) => {
        if (!deps.passkeys) return { passkeys: [] };
        return deps.passkeys.list(getPrincipal(c).userId);
      }),

    RouteBuilder.delete('/passkeys/:credentialId')
      .use(authenticated)
      .handle(async ({ c }) => {
        if (!deps.passkeys) return;
        const credentialId = c.req.param('credentialId') ?? '';
        await deps.passkeys.remove(getPrincipal(c).userId, credentialId);
      }),
  ];
}
