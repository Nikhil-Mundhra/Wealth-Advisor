import type { MiddlewareHandler } from 'hono';
import {
  AdminModelSettingDto,
  AdminSettingsResponse,
  ApiKeyCreatedResponse,
  ApiKeyListResponse,
  CreateApiKeyRequest,
  CreateTenantRequest,
  TenantDto,
  TenantListResponse,
  UpdateAdminModelRequest,
} from '@wealth-advisor/contracts';
import { type RouteDefinition, RouteBuilder } from '#core/http/route-builder.ts';
import type { AdminApi } from '../../admin.api.ts';

export interface AdminRoutesDeps {
  api: AdminApi;
  auth?: MiddlewareHandler;
}

export function adminRoutes(deps: AdminRoutesDeps): readonly RouteDefinition[] {
  const { api, auth } = deps;
  const guard = auth ? [auth] : [];

  return [
    RouteBuilder.get('/tenants')
      .use(...guard)
      .responds(TenantListResponse)
      .handle(async () => api.listTenants()),

    RouteBuilder.post('/tenants')
      .use(...guard)
      .body(CreateTenantRequest)
      .responds(TenantDto, 201)
      .handle(async ({ body }) => api.createTenant(body)),

    RouteBuilder.get('/api-keys')
      .use(...guard)
      .responds(ApiKeyListResponse)
      .handle(async () => api.listApiKeys()),

    RouteBuilder.post('/api-keys')
      .use(...guard)
      .body(CreateApiKeyRequest)
      .responds(ApiKeyCreatedResponse, 201)
      .handle(async ({ body }) => api.createApiKey(body)),

    RouteBuilder.post('/api-keys/:id/revoke')
      .use(...guard)
      .handle(async ({ c }) => {
        const id = c.req.param('id') ?? '';
        await api.revokeApiKey(id);
      }),

    RouteBuilder.get('/models')
      .use(...guard)
      .responds(AdminSettingsResponse)
      .handle(async () => api.getSettings()),

    RouteBuilder.post('/models')
      .use(...guard)
      .body(UpdateAdminModelRequest)
      .responds(AdminModelSettingDto)
      .handle(async ({ body }) => api.updateModelProvider(body.provider)),
  ];
}
