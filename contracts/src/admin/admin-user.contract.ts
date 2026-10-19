import { z } from 'zod';
import { ROLES, USER_STATUSES } from '@wealth-advisor/rules';
import { DisplayNameField } from '../fields/display-name.field.ts';
import { EmailField } from '../fields/email.field.ts';
import { NewPasswordField } from '../fields/password.field.ts';

export const AdminUserLinkedProviderDto = z.object({
  type: z.string(),
  subject: z.string(),
  email: z.string().nullable(),
  linkedAt: z.string(),
  lastLoginAt: z.string().nullable(),
});
export type AdminUserLinkedProviderDto = z.infer<typeof AdminUserLinkedProviderDto>;

export const AdminUserDto = z.object({
  id: z.string(),
  email: z.string(),
  displayName: z.string().nullable(),
  roles: z.array(z.string()),
  status: z.enum(USER_STATUSES),
  tenantId: z.string().nullable(),
  emailVerified: z.boolean(),
  providers: z.array(AdminUserLinkedProviderDto),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type AdminUserDto = z.infer<typeof AdminUserDto>;

export const AdminUserListResponse = z.object({
  users: z.array(AdminUserDto),
  total: z.number(),
});
export type AdminUserListResponse = z.infer<typeof AdminUserListResponse>;

export const AdminUserQueryRequest = z.object({
  q: z.string().optional(),
  role: z.string().optional(),
  status: z.string().optional(),
  tenantId: z.string().optional(),
});
export type AdminUserQueryRequest = z.infer<typeof AdminUserQueryRequest>;

export const CreateAdminUserRequest = z.object({
  email: EmailField,
  displayName: DisplayNameField.optional().nullable(),
  password: NewPasswordField,
  roles: z.array(z.enum(ROLES)).default(['USER']),
  tenantId: z.string().optional().nullable(),
});
export type CreateAdminUserRequest = z.infer<typeof CreateAdminUserRequest>;

export const UpdateAdminUserRequest = z.object({
  displayName: DisplayNameField.optional().nullable(),
  roles: z.array(z.enum(ROLES)).optional(),
  status: z.enum(USER_STATUSES).optional(),
  tenantId: z.string().optional().nullable(),
  emailVerified: z.boolean().optional(),
});
export type UpdateAdminUserRequest = z.infer<typeof UpdateAdminUserRequest>;

export const AdminResetPasswordRequest = z.object({
  password: NewPasswordField,
});
export type AdminResetPasswordRequest = z.infer<typeof AdminResetPasswordRequest>;
