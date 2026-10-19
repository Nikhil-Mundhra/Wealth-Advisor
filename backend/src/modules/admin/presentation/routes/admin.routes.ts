import type { MiddlewareHandler } from 'hono';
import {
  AdminModelSettingDto,
  AdminResetPasswordRequest,
  AdminSettingsResponse,
  AdminUserDto,
  AdminUserListResponse,
  AdminUserQueryRequest,
  ApiKeyCreatedResponse,
  ApiKeyListResponse,
  CreateAdminUserRequest,
  CreateApiKeyRequest,
  CreateTenantRequest,
  PlatformKeysStatusDto,
  TenantDto,
  TenantListResponse,
  UpdateAdminModelRequest,
  UpdateAdminUserRequest,
  UpdatePlatformKeysRequest,
} from '@wealth-advisor/contracts';
import { type RouteDefinition, RouteBuilder } from '#core/http/route-builder.ts';
import type { AdminApi } from '../../admin.api.ts';
import { requireAdminRole } from '../middleware/require-admin-role.ts';

export interface AdminRoutesDeps {
  api: AdminApi;
  auth: MiddlewareHandler;
}

export function adminRoutes(deps: AdminRoutesDeps): readonly RouteDefinition[] {
  const { api, auth } = deps;
  const guard = [auth, requireAdminRole];

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

    RouteBuilder.patch('/models/keys')
      .use(...guard)
      .body(UpdatePlatformKeysRequest)
      .responds(PlatformKeysStatusDto)
      .handle(async ({ body }) => api.updatePlatformKeys(body)),

    RouteBuilder.get('/users')
      .use(...guard)
      .query(AdminUserQueryRequest)
      .responds(AdminUserListResponse)
      .handle(async ({ query }) => api.listUsers(query)),

    RouteBuilder.post('/users')
      .use(...guard)
      .body(CreateAdminUserRequest)
      .responds(AdminUserDto, 201)
      .handle(async ({ body }) => api.createUser(body)),

    RouteBuilder.get('/users/:id')
      .use(...guard)
      .responds(AdminUserDto)
      .handle(async ({ c }) => api.getUser(c.req.param('id') ?? '')),

    RouteBuilder.patch('/users/:id')
      .use(...guard)
      .body(UpdateAdminUserRequest)
      .responds(AdminUserDto)
      .handle(async ({ c, body }) => api.updateUser(c.req.param('id') ?? '', body)),

    RouteBuilder.delete('/users/:id')
      .use(...guard)
      .handle(async ({ c }) => {
        const principal = c.get('principal');
        const id = c.req.param('id') ?? '';
        await api.deleteUser(id, principal?.userId);
      }),

    RouteBuilder.post('/users/:id/reset-password')
      .use(...guard)
      .body(AdminResetPasswordRequest)
      .responds(AdminUserDto)
      .handle(async ({ c, body }) => api.resetUserPassword(c.req.param('id') ?? '', body)),
  ];
}
