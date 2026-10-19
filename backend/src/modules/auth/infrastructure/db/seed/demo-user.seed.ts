import { DEFAULT_TENANT_ID, DEFAULT_USER_ID } from '#core/db/document-id.ts';
import type { IdGenerator } from '#core/domain/id-generator.ts';
import type { Clock } from '#core/time/clock.ts';
import type { Role } from '@wealth-advisor/rules';
import type { PasswordHasherPort } from '../../../application/ports/password-hasher.port.ts';
import type { UserRepositoryPort } from '../../../application/ports/user-repository.port.ts';
import { User } from '../../../domain/entities/user.entity.ts';
import { Email } from '../../../domain/value-objects/email.vo.ts';

export const DEMO_ADMIN_EMAIL = 'Shenzhen@Fintechathon.com';
export const DEMO_ADMIN_PASSWORD = '12345678987654321';

export const DEMO_EMAIL = 'testing@example.com';
export const DEMO_PASSWORD = 'testing';

export interface DemoUserDefinition {
  id?: string;
  email: string;
  password: string;
  displayName: string;
  roles: Role[];
  advisorId?: string | null;
}

export const DEMO_ACCOUNTS: DemoUserDefinition[] = [
  // Administrator
  {
    id: '500000000000000000000099',
    email: DEMO_ADMIN_EMAIL,
    password: DEMO_ADMIN_PASSWORD,
    displayName: 'Shenzhen Admin',
    roles: ['USER', 'ADMIN'],
  },
  // Wealth Analysts / Advisors (2)
  {
    id: '500000000000000000000010',
    email: 'advisor.morgan@syntropy.ch',
    password: 'AdvisorPass123!',
    displayName: 'Alex Morgan',
    roles: ['USER', 'ADVISOR'],
  },
  {
    id: '500000000000000000000020',
    email: 'advisor.jenkins@syntropy.ch',
    password: 'AdvisorPass123!',
    displayName: 'Sarah Jenkins',
    roles: ['USER', 'ADVISOR'],
  },
  // End Clients (4)
  {
    id: DEFAULT_USER_ID,
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    displayName: 'Elena Vance',
    roles: ['USER'],
    advisorId: '500000000000000000000010',
  },
  {
    id: '500000000000000000000002',
    email: 'marcus.vance@example.com',
    password: 'ClientPass123!',
    displayName: 'Marcus Vance',
    roles: ['USER'],
    advisorId: '500000000000000000000010',
  },
  {
    id: '500000000000000000000003',
    email: 'meiling.chen@example.com',
    password: 'ClientPass123!',
    displayName: 'Mei-Ling Chen',
    roles: ['USER'],
    advisorId: '500000000000000000000020',
  },
  {
    id: '500000000000000000000004',
    email: 'rahul.sharma@example.com',
    password: 'ClientPass123!',
    displayName: 'Rahul Sharma',
    roles: ['USER'],
    advisorId: null,
  },
];

export async function seedDemoUser(users: UserRepositoryPort, hasher: PasswordHasherPort, ids: IdGenerator, clock: Clock): Promise<'created' | 'exists'> {
  let createdCount = 0;
  for (const account of DEMO_ACCOUNTS) {
    const email = Email.of(account.email);
    const existing = await users.findActiveByProvider('EMAIL', email.value);
    const passwordHash = await hasher.hash(account.password);
    const now = clock.now();
    if (existing) {
      existing.setPasswordHash(passwordHash, now);
      existing.setRoles(account.roles, now);
      if (account.advisorId !== undefined) {
        existing.assignAdvisor(account.advisorId, now);
      }
      await users.save(existing);
    } else {
      const user = User.registerWithEmail({
        id: account.id ?? ids.next(),
        tenantId: DEFAULT_TENANT_ID,
        advisorId: account.advisorId ?? null,
        email,
        passwordHash,
        displayName: account.displayName,
        now,
        roles: account.roles,
      });
      await users.insert(user);
      createdCount++;
    }
  }
  return createdCount > 0 ? 'created' : 'exists';
}
