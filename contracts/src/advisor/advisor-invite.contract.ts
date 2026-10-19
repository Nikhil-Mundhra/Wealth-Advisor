import { z } from 'zod';

export const CreateAdvisorInviteRequest = z.object({
  clientEmail: z.string().trim().email().optional().nullable(),
  clientName: z.string().trim().optional().nullable(),
  note: z.string().trim().max(200).optional().nullable(),
});
export type CreateAdvisorInviteRequest = z.infer<typeof CreateAdvisorInviteRequest>;

export const AdvisorInviteDto = z.object({
  id: z.string(),
  advisorId: z.string(),
  advisorName: z.string(),
  advisorEmail: z.string(),
  inviteCode: z.string(),
  inviteUrl: z.string(),
  clientEmail: z.string().nullable(),
  clientName: z.string().nullable(),
  note: z.string().nullable(),
  status: z.enum(['PENDING', 'ACCEPTED', 'EXPIRED']),
  expiresAt: z.string(),
  createdAt: z.string(),
});
export type AdvisorInviteDto = z.infer<typeof AdvisorInviteDto>;

export const AdvisorInviteListResponse = z.object({
  invites: z.array(AdvisorInviteDto),
});
export type AdvisorInviteListResponse = z.infer<typeof AdvisorInviteListResponse>;

export const ConnectAdvisorRequest = z.object({
  inviteCode: z.string().trim().min(3),
});
export type ConnectAdvisorRequest = z.infer<typeof ConnectAdvisorRequest>;

export const ClientAdvisorProfileDto = z.object({
  advisorId: z.string(),
  advisorName: z.string(),
  advisorEmail: z.string(),
  firmName: z.string().nullable(),
  connectedAt: z.string(),
});
export type ClientAdvisorProfileDto = z.infer<typeof ClientAdvisorProfileDto>;

export const ClientAdvisorProfileResponse = ClientAdvisorProfileDto.nullable();
export type ClientAdvisorProfileResponse = z.infer<typeof ClientAdvisorProfileResponse>;

export const AdvisorClientSummaryDto = z.object({
  id: z.string(),
  email: z.string(),
  displayName: z.string().nullable(),
  totalValuationBase: z.number(),
  currency: z.string(),
  runwayMonths: z.number(),
  riskBand: z.string(),
  connectedAt: z.string(),
});
export type AdvisorClientSummaryDto = z.infer<typeof AdvisorClientSummaryDto>;

export const AdvisorClientListResponse = z.object({
  clients: z.array(AdvisorClientSummaryDto),
});
export type AdvisorClientListResponse = z.infer<typeof AdvisorClientListResponse>;
