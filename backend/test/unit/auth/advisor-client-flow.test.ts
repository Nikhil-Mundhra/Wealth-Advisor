import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MemoryUserRepository } from '../../../src/modules/auth/infrastructure/db/memory/memory-user.repository.ts';
import { SignupUseCase } from '../../../src/modules/auth/application/use-cases/signup.use-case.ts';
import { ConnectAdvisorUseCase } from '../../../src/modules/auth/application/use-cases/connect-advisor.use-case.ts';
import { GetConnectedAdvisorUseCase } from '../../../src/modules/auth/application/use-cases/get-connected-advisor.use-case.ts';
import { ListAdvisorClientsUseCase } from '../../../src/modules/auth/application/use-cases/list-advisor-clients.use-case.ts';
import { AdvisorInvitesUseCase } from '../../../src/modules/auth/application/use-cases/advisor-invites.use-case.ts';
import { ObjectId } from 'mongodb';
import { User } from '../../../src/modules/auth/domain/entities/user.entity.ts';
import { Email } from '../../../src/modules/auth/domain/value-objects/email.vo.ts';

function setup() {
  const users = new MemoryUserRepository();
  const hasher = { hash: async (pw: string) => `hash_${pw}`, verify: async () => true };
  const ids = { next: () => new ObjectId().toHexString() };
  const clock = { now: () => new Date('2026-10-19T12:00:00Z') };
  const events = { publish: async () => {}, subscribe: () => {} };

  const signup = new SignupUseCase({ users, hasher, ids, clock, events });
  const connectAdvisor = new ConnectAdvisorUseCase({ users, clock });
  const getConnectedAdvisor = new GetConnectedAdvisorUseCase({ users });
  const listClients = new ListAdvisorClientsUseCase({ users });
  const advisorInvites = new AdvisorInvitesUseCase({ users, clock });

  return { users, signup, connectAdvisor, getConnectedAdvisor, listClients, advisorInvites, clock };
}

describe('B2B2C Advisor & Client Workflow', () => {
  it('allows Wealth Analyst to create client invite and lists connected clients', async () => {
    const { users, signup, connectAdvisor, getConnectedAdvisor, listClients, advisorInvites, clock } = setup();

    const advisorId = new ObjectId().toHexString();
    // 1. Create a Wealth Analyst account
    const advisorUser = User.registerWithEmail({
      id: advisorId,
      tenantId: new ObjectId().toHexString(),
      email: Email.of('elena.advisor@syntropy.ch'),
      passwordHash: 'hashed_pw',
      displayName: 'Elena Rostova',
      roles: ['USER', 'ADVISOR'],
      now: clock.now(),
    });
    await users.insert(advisorUser);

    // 2. Advisor generates an invitation for a prospective client
    const invite = await advisorInvites.createInvite(advisorId, {
      clientEmail: 'marcus.v@expat.de',
      clientName: 'Marcus Vance',
      note: 'Cross-border family office onboarding',
    }, 'https://app.syntropy.ch');

    assert.equal(invite.advisorId, advisorId);
    assert.equal(invite.advisorName, 'Elena Rostova');
    assert.ok(invite.inviteCode.startsWith('ADV-'));
    assert.equal(invite.status, 'PENDING');

    // 3. Client registers using the advisor code
    const clientSignup = await signup.execute({
      email: 'marcus.v@expat.de',
      password: 'SecurePassword123!',
      displayName: 'Marcus Vance',
      advisorCode: invite.inviteCode,
    });

    // 4. Verify client is connected to advisor
    const client = await users.findActiveById(clientSignup.userId);
    assert.equal(client?.advisorId, advisorId);

    // 5. Client views their assigned advisor profile
    const assigned = await getConnectedAdvisor.execute({ userId: clientSignup.userId });
    assert.ok(assigned);
    assert.equal(assigned?.advisorId, advisorId);
    assert.equal(assigned?.advisorName, 'Elena Rostova');

    // 6. Advisor views their client roster
    const roster = await listClients.execute({ advisorId });
    assert.equal(roster.clients.length, 1);
    assert.equal(roster.clients[0].id, clientSignup.userId);
    assert.equal(roster.clients[0].email, 'marcus.v@expat.de');
    assert.equal(roster.clients[0].displayName, 'Marcus Vance');
  });

  it('allows self-directed client to connect to an advisor post-registration', async () => {
    const { users, signup, connectAdvisor, getConnectedAdvisor, listClients, clock } = setup();

    const advisorId = new ObjectId().toHexString();
    // 1. Create advisor
    const advisorUser = User.registerWithEmail({
      id: advisorId,
      tenantId: new ObjectId().toHexString(),
      email: Email.of('chen.wei@syntropy.sg'),
      passwordHash: 'hashed_pw',
      displayName: 'Wei Chen',
      roles: ['USER', 'ADVISOR'],
      now: clock.now(),
    });
    await users.insert(advisorUser);

    // 2. Direct client signs up without an advisor
    const clientSignup = await signup.execute({
      email: 'direct.client@example.com',
      password: 'SecurePassword123!',
      displayName: 'Direct Client',
    });

    let assigned = await getConnectedAdvisor.execute({ userId: clientSignup.userId });
    assert.equal(assigned, null);

    // 3. Client connects advisor using invite code / advisor code
    const updated = await connectAdvisor.execute({
      userId: clientSignup.userId,
      inviteCode: `ADV-${advisorId}`,
    });
    assert.equal(updated.advisorId, advisorId);

    // 4. Client now has connected advisor
    assigned = await getConnectedAdvisor.execute({ userId: clientSignup.userId });
    assert.equal(assigned?.advisorId, advisorId);
    assert.equal(assigned?.advisorName, 'Wei Chen');

    // 5. Advisor roster reflects new client
    const roster = await listClients.execute({ advisorId });
    assert.equal(roster.clients.length, 1);
    assert.equal(roster.clients[0].email, 'direct.client@example.com');
  });
});
