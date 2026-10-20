import assert from 'node:assert/strict';
import { createHash, generateKeyPairSync, sign, type KeyObject } from 'node:crypto';
import { describe, it } from 'node:test';
import { ObjectId } from 'mongodb';
import { DEFAULT_TENANT_ID, DEFAULT_USER_ID } from '../../../src/core/db/document-id.ts';
import {
  createPasskeyService,
  defaultRpId,
  MemoryPasskeyChallengeStore,
  MemoryPasskeyStore,
} from '../../../src/core/crypto/passkey-verifier.ts';
import { PasskeyUseCase } from '../../../src/modules/auth/application/use-cases/passkey.use-case.ts';
import { TokenPairIssuer } from '../../../src/modules/auth/application/use-cases/issue-token-pair.ts';
import { MemoryUserRepository } from '../../../src/modules/auth/infrastructure/db/memory/memory-user.repository.ts';
import { MemorySessionRepository } from '../../../src/modules/auth/infrastructure/db/memory/memory-session.repository.ts';
import { User } from '../../../src/modules/auth/domain/entities/user.entity.ts';
import { Email } from '../../../src/modules/auth/domain/value-objects/email.vo.ts';
import { createWealthApi } from '../../../src/modules/wealth/wealth.api.ts';
import {
  MemoryAssetProductRepository,
  MemoryPortfolioRepository,
  MemoryRiskProfileRepository,
  MemorySandboxLedgerRepository,
} from '../../../src/modules/wealth/infrastructure/db/memory/memory-wealth.repository.ts';

const RP_ID = 'localhost';
const ORIGIN = 'http://localhost:5173';

function setup() {
  let now = new Date('2026-10-20T12:00:00Z');
  const clock = { now: () => now };
  const advance = (ms: number) => {
    now = new Date(now.getTime() + ms);
  };
  const store = new MemoryPasskeyStore();
  const challenges = new MemoryPasskeyChallengeStore();
  const passkeys = createPasskeyService(store, { challenges, clock, rpId: RP_ID, challengeTtlSeconds: 300 });
  const users = new MemoryUserRepository();
  const sessions = new MemorySessionRepository();
  const signer = {
    sign: async (claims: { subject: string }) => ({ token: `access_${claims.subject}`, expiresIn: 900 }),
    verify: async () => {
      throw new Error('not implemented');
    },
  };
  const issuer = new TokenPairIssuer({ sessions, signer });
  const ids = { next: () => new ObjectId().toHexString() };
  const useCase = new PasskeyUseCase({
    users,
    passkeys,
    clock,
    rpId: RP_ID,
    rpName: 'Syntropy AI',
    issuer,
    ids,
    tokenConfig: { refreshTokenTtlSeconds: 3600, reuseGraceSeconds: 5 },
  });
  const wealthApi = createWealthApi({
    products: new MemoryAssetProductRepository(),
    portfolios: new MemoryPortfolioRepository(),
    profiles: new MemoryRiskProfileRepository(),
    ledger: new MemorySandboxLedgerRepository(),
    passkeys,
    clock,
  });
  return { users, passkeys, useCase, wealthApi, clock, advance };
}

async function enrollUser(
  users: MemoryUserRepository,
  useCase: PasskeyUseCase,
  userId: string,
  credentialId: string,
  spkiBase64: string,
) {
  const user = User.registerWithEmail({
    id: userId,
    tenantId: DEFAULT_TENANT_ID,
    email: Email.of('elena.vance@example.com'),
    passwordHash: 'hashed_pw',
    displayName: 'Elena Vance',
    roles: ['USER'],
    now: new Date('2026-10-20T12:00:00Z'),
  });
  await users.insert(user);

  const options = await useCase.getRegistrationOptions(userId);
  assert.ok(options.challenge);
  assert.equal(options.rp.name, 'Syntropy AI');

  const regResult = await useCase.verifyRegistration(userId, 'default', {
    credentialId,
    clientDataJson: Buffer.from(JSON.stringify({ type: 'webauthn.create', challenge: options.challenge, origin: ORIGIN })).toString('base64url'),
    attestationObject: spkiBase64,
    publicKeySpki: spkiBase64,
    deviceName: 'Elena MacBook TouchID',
  });
  assert.equal(regResult.verified, true);
  return options;
}

function createMockAssertion(
  privateKey: KeyObject,
  credentialId: string,
  input: { challenge: string; origin?: string; counter?: number },
) {
  const clientData = JSON.stringify({
    type: 'webauthn.get',
    challenge: input.challenge,
    origin: input.origin ?? ORIGIN,
  });
  const clientDataHash = createHash('sha256').update(Buffer.from(clientData, 'utf8')).digest();

  // 37 bytes: 32 bytes rpIdHash + 1 byte flags (0x05) + 4 bytes counter
  const rpIdHash = createHash('sha256').update(RP_ID).digest();
  const flags = Buffer.from([0x05]); // UP (0x01) and UV (0x04)
  const counter = Buffer.alloc(4);
  counter.writeUInt32BE(input.counter ?? 1);
  const authData = Buffer.concat([rpIdHash, flags, counter]);

  const signedPayload = Buffer.concat([authData, clientDataHash]);
  const signature = sign('sha256', signedPayload, privateKey);

  return {
    credentialId,
    clientDataJson: Buffer.from(clientData, 'utf8').toString('base64url'),
    authenticatorData: authData.toString('base64url'),
    signature: signature.toString('base64url'),
  };
}

const TRADE = {
  orderType: 'PORTFOLIO_REBALANCE',
  trades: [{ assetSymbol: 'CSPX.LSE', action: 'SELL', amountBase: 1900000, targetWeight: 0.4 }],
} as const;

describe('Passkey WebAuthn Ceremony & Execution Gating', () => {
  it('registers passkey and verifies authentic ECDSA signature on rebalance execution', async () => {
    const { users, useCase, wealthApi } = setup();
    const userId = DEFAULT_USER_ID;
    const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
    const spkiBase64 = publicKey.export({ format: 'der', type: 'spki' }).toString('base64');
    const credentialId = 'cred_elena_macbook_touchid';
    await enrollUser(users, useCase, userId, credentialId, spkiBase64);

    const listed = await useCase.list(userId);
    assert.equal(listed.passkeys.length, 1);
    assert.equal(listed.passkeys[0]?.credentialId, credentialId);
    assert.equal(listed.passkeys[0]?.deviceName, 'Elena MacBook TouchID');

    const { challenge } = await useCase.stepUpChallenge(userId);
    const execResult = await wealthApi.executeTrade('default', userId, {
      ...TRADE,
      trades: [...TRADE.trades],
      passkeyAssertion: createMockAssertion(privateKey, credentialId, { challenge, counter: 1 }),
    });

    assert.equal(execResult.success, true);
    assert.equal(execResult.ledgerEntry.status, 'COMMITTED');
    assert.ok(execResult.ledgerEntry.auditDigest.length === 64);
    assert.ok(execResult.ledgerEntry.transactionHash.startsWith('0x'));

    // A tampered signature on a fresh challenge is refused before any read or write.
    const { challenge: fresh } = await useCase.stepUpChallenge(userId);
    const tamperedAssertion = {
      ...createMockAssertion(privateKey, credentialId, { challenge: fresh, counter: 2 }),
      signature: Buffer.from('invalid_signature_bytes_that_do_not_verify').toString('base64url'),
    };
    await assert.rejects(
      () => wealthApi.executeTrade('default', userId, { ...TRADE, trades: [...TRADE.trades], passkeyAssertion: tamperedAssertion }),
      (err: unknown) => (err as { code?: string }).code === 'WL_1004',
    );
  });

  it('refuses a replayed assertion once the step-up challenge is consumed', async () => {
    const { users, useCase, wealthApi } = setup();
    const userId = DEFAULT_USER_ID;
    const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
    await enrollUser(users, useCase, userId, 'cred_replay', publicKey.export({ format: 'der', type: 'spki' }).toString('base64'));

    const { challenge } = await useCase.stepUpChallenge(userId);
    const assertion = createMockAssertion(privateKey, 'cred_replay', { challenge, counter: 1 });
    const ok = await wealthApi.executeTrade('default', userId, { ...TRADE, trades: [...TRADE.trades], passkeyAssertion: assertion });
    assert.equal(ok.success, true);

    await assert.rejects(
      () => wealthApi.executeTrade('default', userId, { ...TRADE, trades: [...TRADE.trades], passkeyAssertion: assertion }),
      (err: unknown) => (err as { code?: string }).code === 'WL_1004',
    );
  });

  it('refuses an expired step-up challenge', async () => {
    const { users, useCase, wealthApi, advance } = setup();
    const userId = DEFAULT_USER_ID;
    const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
    await enrollUser(users, useCase, userId, 'cred_expiry', publicKey.export({ format: 'der', type: 'spki' }).toString('base64'));

    const { challenge } = await useCase.stepUpChallenge(userId);
    advance(301_000);
    await assert.rejects(
      () =>
        wealthApi.executeTrade('default', userId, {
          ...TRADE,
          trades: [...TRADE.trades],
          passkeyAssertion: createMockAssertion(privateKey, 'cred_expiry', { challenge, counter: 1 }),
        }),
      (err: unknown) => (err as { code?: string }).code === 'WL_1004',
    );
  });

  it('refuses an assertion minted for another origin', async () => {
    const { users, useCase, wealthApi } = setup();
    const userId = DEFAULT_USER_ID;
    const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
    await enrollUser(users, useCase, userId, 'cred_origin', publicKey.export({ format: 'der', type: 'spki' }).toString('base64'));

    const { challenge } = await useCase.stepUpChallenge(userId);
    await assert.rejects(
      () =>
        wealthApi.executeTrade('default', userId, {
          ...TRADE,
          trades: [...TRADE.trades],
          passkeyAssertion: createMockAssertion(privateKey, 'cred_origin', { challenge, origin: 'https://evil.example', counter: 1 }),
        }),
      (err: unknown) => (err as { code?: string }).code === 'WL_1004',
    );
  });

  it('refuses a cloned authenticator whose counter does not advance', async () => {
    const { users, useCase, wealthApi } = setup();
    const userId = DEFAULT_USER_ID;
    const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
    await enrollUser(users, useCase, userId, 'cred_clone', publicKey.export({ format: 'der', type: 'spki' }).toString('base64'));

    const first = await useCase.stepUpChallenge(userId);
    const ok = await wealthApi.executeTrade('default', userId, {
      ...TRADE,
      trades: [...TRADE.trades],
      passkeyAssertion: createMockAssertion(privateKey, 'cred_clone', { challenge: first.challenge, counter: 1 }),
    });
    assert.equal(ok.success, true);

    const second = await useCase.stepUpChallenge(userId);
    await assert.rejects(
      () =>
        wealthApi.executeTrade('default', userId, {
          ...TRADE,
          trades: [...TRADE.trades],
          passkeyAssertion: createMockAssertion(privateKey, 'cred_clone', { challenge: second.challenge, counter: 1 }),
        }),
      (err: unknown) => (err as { code?: string }).code === 'WL_1004',
    );

    const third = await useCase.stepUpChallenge(userId);
    const advanced = await wealthApi.executeTrade('default', userId, {
      ...TRADE,
      trades: [...TRADE.trades],
      passkeyAssertion: createMockAssertion(privateKey, 'cred_clone', { challenge: third.challenge, counter: 2 }),
    });
    assert.equal(advanced.success, true);
  });

  it('signs in with a passkey and issues a token pair', async () => {
    const { users, useCase } = setup();
    const userId = DEFAULT_USER_ID;
    const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
    await enrollUser(users, useCase, userId, 'cred_login', publicKey.export({ format: 'der', type: 'spki' }).toString('base64'));

    const options = await useCase.loginOptions('elena.vance@example.com');
    assert.ok(options.challenge);
    assert.deepEqual(options.allowCredentials, [{ id: 'cred_login', type: 'public-key' }]);

    const tokens = await useCase.verifyLogin('elena.vance@example.com', createMockAssertion(privateKey, 'cred_login', { challenge: options.challenge, counter: 1 }));
    assert.ok(tokens.accessToken.startsWith('access_'));

    await assert.rejects(
      () => useCase.verifyLogin('unknown@example.com', createMockAssertion(privateKey, 'cred_login', { challenge: options.challenge, counter: 2 })),
      (err: unknown) => (err as { code?: string }).code === 'AU_1002',
    );
  });

  it('refuses registration when the challenge does not match', async () => {
    const { useCase, users } = setup();
    const userId = DEFAULT_USER_ID;
    const user = User.registerWithEmail({
      id: userId,
      tenantId: DEFAULT_TENANT_ID,
      email: Email.of('elena.vance@example.com'),
      passwordHash: 'hashed_pw',
      displayName: 'Elena Vance',
      roles: ['USER'],
      now: new Date('2026-10-20T12:00:00Z'),
    });
    await users.insert(user);
    await useCase.getRegistrationOptions(userId);

    const { publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
    const spkiBase64 = publicKey.export({ format: 'der', type: 'spki' }).toString('base64');
    await assert.rejects(
      () =>
        useCase.verifyRegistration(userId, 'default', {
          credentialId: 'cred_stale',
          clientDataJson: Buffer.from(JSON.stringify({ type: 'webauthn.create', challenge: 'stale_challenge', origin: ORIGIN })).toString('base64url'),
          attestationObject: spkiBase64,
          publicKeySpki: spkiBase64,
        }),
      (err: unknown) => (err as { code?: string }).code === 'AU_1008',
    );
  });

  it('resolves the relying party id for local and deployed hosts', () => {
    assert.equal(defaultRpId('wealth-advisor.vercel.app'), 'wealth-advisor.vercel.app');
    assert.equal(defaultRpId(undefined), 'localhost');
    const previous = process.env.VERCEL_URL;
    process.env.VERCEL_URL = 'dewa-preview-7.vercel.app';
    try {
      assert.equal(defaultRpId(undefined), 'dewa-preview-7.vercel.app');
    } finally {
      if (previous === undefined) delete process.env.VERCEL_URL;
      else process.env.VERCEL_URL = previous;
    }
  });
});
