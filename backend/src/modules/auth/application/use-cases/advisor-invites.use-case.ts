import type { AdvisorInviteDto, AdvisorInviteListResponse, CreateAdvisorInviteRequest } from '@wealth-advisor/contracts';
import { generateOpaqueToken } from '#core/crypto/random-token.ts';
import type { Clock } from '#core/time/clock.ts';
import { AuthErrors } from '../../domain/errors/auth-errors.ts';
import type { UserRepositoryPort } from '../ports/user-repository.port.ts';

interface AdvisorInvitesDeps {
  readonly users: UserRepositoryPort;
  readonly clock: Clock;
}

export class AdvisorInvitesUseCase {
  private readonly deps: AdvisorInvitesDeps;
  private readonly invites = new Map<string, AdvisorInviteDto>();

  constructor(deps: AdvisorInvitesDeps) {
    this.deps = deps;
  }

  async createInvite(advisorId: string, input: CreateAdvisorInviteRequest, origin = ''): Promise<AdvisorInviteDto> {
    const advisor = await this.deps.users.findActiveById(advisorId);
    if (!advisor || (!advisor.roles.includes('ADVISOR') && !advisor.roles.includes('ADMIN'))) {
      throw AuthErrors.unauthenticated();
    }

    const inviteCode = `ADV-${advisor.id}`;
    const now = this.deps.clock.now();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const id = generateOpaqueToken(12);
    const inviteUrl = `${origin}/signup?advisor=${inviteCode}`;

    const dto: AdvisorInviteDto = {
      id,
      advisorId: advisor.id,
      advisorName: advisor.displayName ?? 'Wealth Analyst',
      advisorEmail: advisor.email.value,
      inviteCode,
      inviteUrl,
      clientEmail: input.clientEmail ?? null,
      clientName: input.clientName ?? null,
      note: input.note ?? null,
      status: 'PENDING',
      expiresAt: expiresAt.toISOString(),
      createdAt: now.toISOString(),
    };

    this.invites.set(id, dto);
    return dto;
  }

  async listInvites(advisorId: string, origin = ''): Promise<AdvisorInviteListResponse> {
    const advisor = await this.deps.users.findActiveById(advisorId);
    if (!advisor || (!advisor.roles.includes('ADVISOR') && !advisor.roles.includes('ADMIN'))) {
      throw AuthErrors.unauthenticated();
    }

    const defaultInviteCode = `ADV-${advisor.id}`;

    const existing = Array.from(this.invites.values()).filter((i) => i.advisorId === advisorId);
    if (existing.length === 0) {
      // Seed an active invitation link for the advisor
      const now = this.deps.clock.now();
      const defaultInvite: AdvisorInviteDto = {
        id: `inv_${advisorId}`,
        advisorId,
        advisorName: advisor.displayName ?? 'Wealth Analyst',
        advisorEmail: advisor.email.value,
        inviteCode: defaultInviteCode,
        inviteUrl: `${origin}/signup?advisor=${defaultInviteCode}`,
        clientEmail: null,
        clientName: 'General Client Onboarding Link',
        note: 'Default delegation link for prospective wealth management clients',
        status: 'PENDING',
        expiresAt: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: now.toISOString(),
      };
      this.invites.set(defaultInvite.id, defaultInvite);
      return { invites: [defaultInvite] };
    }

    return { invites: existing };
  }
}
