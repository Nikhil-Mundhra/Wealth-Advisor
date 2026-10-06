import {
  AdminModelSettingDto,
  AdminSettingsResponse,
  ApiKeyCreatedResponse,
  ApiKeyListResponse,
  type CreateApiKeyRequest,
  type CreateTenantRequest,
  TenantDto,
  TenantListResponse,
  type UpdateAdminModelRequest,
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
