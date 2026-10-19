import {
  AdvisorClientListResponse,
  AdvisorInviteDto,
  AdvisorInviteListResponse,
  ClientAdvisorProfileResponse,
  type ConnectAdvisorRequest,
  type CreateAdvisorInviteRequest,
  type LoginRequest,
  MeResponse,
  type SignupRequest,
  SignupResponse,
  TokenPairResponse,
} from '@wealth-advisor/contracts';
import { apiRequest } from '../../../lib/api-client.ts';

// The auth endpoints, typed and validated by the shared contracts.
export const authApi = {
  signup: (body: SignupRequest) => apiRequest('/auth/signup', { method: 'POST', body, response: SignupResponse }),
  login: (body: LoginRequest) => apiRequest('/auth/login', { method: 'POST', body, response: TokenPairResponse }),
  // The refresh token travels as the HttpOnly cookie; nothing is sent in the body.
  refresh: () => apiRequest('/auth/refresh', { method: 'POST', response: TokenPairResponse }),
  logout: () => apiRequest('/auth/logout', { method: 'POST', authenticated: true }),
  me: () => apiRequest('/auth/me', { response: MeResponse, authenticated: true }),
  deleteAccount: () => apiRequest('/auth/me', { method: 'DELETE', authenticated: true }),
  connectAdvisor: (body: ConnectAdvisorRequest) =>
    apiRequest('/auth/me/advisor', { method: 'POST', body, response: MeResponse, authenticated: true }),
  getConnectedAdvisor: () =>
    apiRequest('/auth/me/advisor', { response: ClientAdvisorProfileResponse, authenticated: true }),
  listAdvisorClients: () =>
    apiRequest('/auth/advisor/clients', { response: AdvisorClientListResponse, authenticated: true }),
  listAdvisorInvites: () =>
    apiRequest('/auth/advisor/invites', { response: AdvisorInviteListResponse, authenticated: true }),
  createAdvisorInvite: (body: CreateAdvisorInviteRequest) =>
    apiRequest('/auth/advisor/invites', { method: 'POST', body, response: AdvisorInviteDto, authenticated: true }),
};
