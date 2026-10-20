import assert from 'node:assert/strict';
import { createHash, generateKeyPairSync, sign } from 'node:crypto';
import { describe, it } from 'node:test';
import { ObjectId } from 'mongodb';
import { DEFAULT_TENANT_ID, DEFAULT_USER_ID } from '../../../src/core/db/document-id.ts';
import {
  createPasskeyService,
  MemoryPasskeyStore,
  verifyPasskeyAssertion,
} from '../../../src/core/crypto/passkey-verifier.ts';
import { PasskeyUseCase } from '../../../src/modules/auth/application/use-cases/passkey.use-case.ts';
import { MemoryUserRepository } from '../../../src/modules/auth/infrastructure/db/memory/memory-user.repository.ts';
import { User } from '../../../src/modules/auth/domain/entities/user.entity.ts';
import { Email } from '../../../src/modules/auth/domain/value-objects/email.vo.ts';
import { createWealthApi } from '../../../src/modules/wealth/wealth.api.ts';
import {
  MemoryAssetProductRepository,
  MemoryPortfolioRepository,
  MemoryRiskProfileRepository,
  MemorySandboxLedgerRepository,
} from '../../../src/modules/wealth/infrastructure/db/memory/memory-wealth.repository.ts';

function createMockAssertion(privateKey: import('node:crypto').KeyObject, credentialId: string, challenge = 'chal_test_123') {
  const clientData = JSON.stringify({
    type: 'webauthn.get',
    challenge,
    origin: 'http://localhost:5173',
  });
  const clientDataHash = createHash('sha256').update(Buffer.from(clientData, 'utf8')).digest();

  // 37 bytes: 32 bytes rpIdHash + 1 byte flags (0x05) + 4 bytes counter
  const rpIdHash = createHash('sha256').update('localhost').digest();
  const flags = Buffer.from([0x05]); // UP (0x01) and UV (0x04)
  const counter = Buffer.alloc(4);
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

describe('Passkey WebAuthn Ceremony & Execution Gating', () => {
  it('registers passkey and verifies authentic ECDSA signature on rebalance execution', async () => {
    const store = new MemoryPasskeyStore();
    const passkeyService = createPasskeyService(store);
    const users = new MemoryUserRepository();
    const clock = { now: () => new Date('2026-10-20T12:00:00Z') };

    const userId = DEFAULT_USER_ID;
    const user = User.registerWithEmail({
      id: userId,
      tenantId: DEFAULT_TENANT_ID,
      email: Email.of('elena.vance@example.com'),
      passwordHash: 'hashed_pw',
      displayName: 'Elena Vance',
      roles: ['USER'],
      now: clock.now(),
    });
    await users.insert(user);

    const useCase = new PasskeyUseCase({ users, passkeys: passkeyService, clock });

    // 1. Get registration options
    const options = await useCase.getRegistrationOptions(userId);
    assert.ok(options.challenge);
    assert.equal(options.rp.name, 'Syntropy AI');

    // 2. Generate a real ECDSA P-256 keypair
    const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
    const spkiBase64 = publicKey.export({ format: 'der', type: 'spki' }).toString('base64');
    const credentialId = 'cred_elena_macbook_touchid';

    // 3. Register passkey
    const regResult = await useCase.verifyRegistration(userId, 'default', {
      credentialId,
      clientDataJson: Buffer.from(JSON.stringify({ type: 'webauthn.create', challenge: options.challenge })).toString('base64url'),
      attestationObject: spkiBase64,
      publicKeySpki: spkiBase64,
      deviceName: 'Elena MacBook TouchID',
    });
    assert.equal(regResult.verified, true);

    // 4. Verify listed credentials
    const listed = await useCase.list(userId);
    assert.equal(listed.passkeys.length, 1);
    assert.equal(listed.passkeys[0]?.credentialId, credentialId);
    assert.equal(listed.passkeys[0]?.deviceName, 'Elena MacBook TouchID');

    // 5. Test verification in WealthApi with valid signature
    const products = new MemoryAssetProductRepository();
    const portfolios = new MemoryPortfolioRepository();
    const profiles = new MemoryRiskProfileRepository();
    const ledger = new MemorySandboxLedgerRepository();
    const wealthApi = createWealthApi({
      products,
      portfolios,
      profiles,
      ledger,
      passkeys: passkeyService,
      clock,
    });

    const validAssertion = createMockAssertion(privateKey, credentialId);

    const execResult = await wealthApi.executeTrade('default', userId, {
      orderType: 'PORTFOLIO_REBALANCE',
      trades: [
        {
          assetSymbol: 'CSPX.LSE',
          action: 'SELL',
          amountBase: 1900000,
          targetWeight: 0.40,
        },
      ],
      passkeyAssertion: validAssertion,
    });

    assert.equal(execResult.success, true);
    assert.equal(execResult.ledgerEntry.status, 'COMMITTED');
    assert.ok(execResult.ledgerEntry.auditDigest.length === 64);
    assert.ok(execResult.ledgerEntry.transactionHash.startsWith('0x'));

    // 6. Test verification failure with tampered signature
    const tamperedAssertion = {
      ...validAssertion,
      signature: Buffer.from('invalid_signature_bytes_that_do_not_verify').toString('base64url'),
    };

    await assert.rejects(
      async () => {
        await wealthApi.executeTrade('default', userId, {
          orderType: 'PORTFOLIO_REBALANCE',
          trades: [
            {
              assetSymbol: 'CSPX.LSE',
              action: 'SELL',
              amountBase: 1900000,
              targetWeight: 0.40,
            },
          ],
          passkeyAssertion: tamperedAssertion,
        });
      },
      (err: any) => err.code === 'WL_1004',
    );
  });
});
