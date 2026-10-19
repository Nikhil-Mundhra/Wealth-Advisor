import {
  AdminModelSettingDto,
  AdminResetPasswordRequest,
  AdminSettingsResponse,
  AdminUserDto,
  AdminUserListResponse,
  type AdminUserQueryRequest,
  ApiKeyCreatedResponse,
  ApiKeyListResponse,
  PlatformKeysStatusDto,
  type CreateAdminUserRequest,
  type CreateApiKeyRequest,
  type CreateTenantRequest,
  TenantDto,
  TenantListResponse,
  type UpdateAdminModelRequest,
  type UpdateAdminUserRequest,
  type UpdatePlatformKeysRequest,
} from '@wealth-advisor/contracts';
import { apiRequest } from '../../../lib/api-client.ts';

export async function fetchTenants(): Promise<TenantListResponse> {
  return apiRequest('/admin/tenants', { response: TenantListResponse, authenticated: true });
}

export async function createTenant(data: CreateTenantRequest): Promise<TenantDto> {
  return apiRequest('/admin/tenants', { method: 'POST', body: data, response: TenantDto, authenticated: true });
}

export async function fetchApiKeys(): Promise<ApiKeyListResponse> {
  return apiRequest('/admin/api-keys', { response: ApiKeyListResponse, authenticated: true });
}

export async function createApiKey(data: CreateApiKeyRequest): Promise<ApiKeyCreatedResponse> {
  return apiRequest('/admin/api-keys', { method: 'POST', body: data, response: ApiKeyCreatedResponse, authenticated: true });
}

export async function revokeApiKey(id: string): Promise<void> {
  return apiRequest(`/admin/api-keys/${id}/revoke`, { method: 'POST', authenticated: true });
}

export async function fetchAdminModels(): Promise<AdminSettingsResponse> {
  return apiRequest('/admin/models', { response: AdminSettingsResponse, authenticated: true });
}

export async function updateAdminModel(provider: UpdateAdminModelRequest['provider']): Promise<AdminModelSettingDto> {
  return apiRequest('/admin/models', { method: 'POST', body: { provider }, response: AdminModelSettingDto, authenticated: true });
}

export async function updatePlatformKeys(data: UpdatePlatformKeysRequest): Promise<PlatformKeysStatusDto> {
  return apiRequest('/admin/models/keys', { method: 'PATCH', body: data, response: PlatformKeysStatusDto, authenticated: true });
}

export async function fetchAdminUsers(params?: AdminUserQueryRequest): Promise<AdminUserListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.q) searchParams.set('q', params.q);
  if (params?.role && params.role !== 'ALL') searchParams.set('role', params.role);
  if (params?.status && params.status !== 'ALL') searchParams.set('status', params.status);
  if (params?.tenantId && params.tenantId !== 'ALL') searchParams.set('tenantId', params.tenantId);
  const qs = searchParams.toString();
  const path = qs ? `/admin/users?${qs}` : '/admin/users';
  return apiRequest(path, { response: AdminUserListResponse, authenticated: true });
}

export async function fetchAdminUser(id: string): Promise<AdminUserDto> {
  return apiRequest(`/admin/users/${id}`, { response: AdminUserDto, authenticated: true });
}

export async function createAdminUser(data: CreateAdminUserRequest): Promise<AdminUserDto> {
  return apiRequest('/admin/users', { method: 'POST', body: data, response: AdminUserDto, authenticated: true });
}

export async function updateAdminUser(id: string, data: UpdateAdminUserRequest): Promise<AdminUserDto> {
  return apiRequest(`/admin/users/${id}`, { method: 'PATCH', body: data, response: AdminUserDto, authenticated: true });
}

export async function deleteAdminUser(id: string): Promise<void> {
  return apiRequest(`/admin/users/${id}`, { method: 'DELETE', authenticated: true });
}

export async function resetAdminUserPassword(id: string, data: AdminResetPasswordRequest): Promise<AdminUserDto> {
  return apiRequest(`/admin/users/${id}/reset-password`, { method: 'POST', body: data, response: AdminUserDto, authenticated: true });
}
