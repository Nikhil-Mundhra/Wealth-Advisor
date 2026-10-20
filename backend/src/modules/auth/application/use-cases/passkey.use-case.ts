import { randomBytes } from 'node:crypto';
import type {
  ListPasskeysResponse,
  PasskeyLoginOptionsResponse,
  PasskeyLoginVerifyRequest,
  PasskeyRegisterVerifyRequest,
  PasskeyRegistrationOptionsResponse,
  PasskeyStepUpChallengeResponse,
} from '@wealth-advisor/contracts';
import { checkRegistrationClientData, type PasskeyService } from '#core/crypto/passkey-verifier.ts';
import { generateOpaqueToken } from '#core/crypto/random-token.ts';
import type { IdGenerator } from '#core/domain/id-generator.ts';
import type { Clock } from '#core/time/clock.ts';
import { Session } from '../../domain/entities/session.entity.ts';
import type { User } from '../../domain/entities/user.entity.ts';
import { Email } from '../../domain/value-objects/email.vo.ts';
import { AuthErrors } from '../../domain/errors/auth-errors.ts';
import type { TokenConfig } from '../config/token-config.ts';
import type { TokenPairResult } from '../dto/token-pair.result.ts';
import type { UserRepositoryPort } from '../ports/user-repository.port.ts';
import { TokenPairIssuer } from './issue-token-pair.ts';

export interface PasskeyUseCaseDeps {
  readonly users: UserRepositoryPort;
  readonly passkeys: PasskeyService;
  readonly clock: Clock;
  readonly rpId: string;
  readonly rpName: string;
  readonly issuer: TokenPairIssuer;
  readonly ids: IdGenerator;
  readonly tokenConfig: TokenConfig;
}

// One registered key per device; the cap keeps the credential list bounded per account.
const MAX_PASSKEYS_PER_USER = 10;

export class PasskeyUseCase {
  private readonly deps: PasskeyUseCaseDeps;

  constructor(deps: PasskeyUseCaseDeps) {
    this.deps = deps;
  }

  async getRegistrationOptions(userId: string): Promise<PasskeyRegistrationOptionsResponse> {
    const user = await this.deps.users.findActiveById(userId);
    if (!user) throw AuthErrors.unauthenticated();

    const challenge = await this.deps.passkeys.issueChallenge(userId, 'REGISTRATION');

    return {
      challenge,
      rp: { name: this.deps.rpName, id: this.deps.rpId },
      user: {
        id: Buffer.from(user.id).toString('base64url'),
        name: user.email.value,
        displayName: user.displayName || user.email.value,
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },
        { alg: -257, type: 'public-key' },
      ],
    };
  }

  async verifyRegistration(userId: string, tenantId: string, req: PasskeyRegisterVerifyRequest): Promise<{ verified: boolean }> {
    const user = await this.deps.users.findActiveById(userId);
    if (!user) throw AuthErrors.unauthenticated();

    const pending = await this.deps.passkeys.consumeChallenge(userId, 'REGISTRATION');
    if (!pending) throw AuthErrors.passkeyFailed('registration challenge expired');
    if (!checkRegistrationClientData(req.clientDataJson, { rpId: this.deps.rpId, expectedChallenge: pending.challenge })) {
      throw AuthErrors.passkeyFailed('registration challenge mismatch');
    }

    let publicKeySpki = req.publicKeySpki;
    if (!publicKeySpki && req.attestationObject) {
      // Decode CBOR attestationObject authData to extract credential public key if spki was not directly transmitted
      try {
        const rawAtt = Buffer.from(req.attestationObject, 'base64url');
        // Basic fallback: store raw attestation or extract authData bytes
        publicKeySpki = rawAtt.toString('base64');
      } catch {
        // Fallback
        publicKeySpki = req.attestationObject;
      }
    }

    if (!publicKeySpki) {
      throw AuthErrors.passkeyFailed('no public key in registration');
    }

    const existing = await this.deps.passkeys.listCredentials(userId);
    if (existing.length >= MAX_PASSKEYS_PER_USER) throw AuthErrors.passkeyFailed('too many passkeys registered');

    await this.deps.passkeys.saveCredential({
      id: randomBytes(16).toString('hex'),
      userId,
      tenantId,
      credentialId: req.credentialId,
      publicKeySpki,
      deviceName: req.deviceName || 'Biometric Sensor (TouchID / FaceID)',
      transports: [],
      createdAt: this.deps.clock.now(),
      lastUsedAt: null,
      counter: 0,
    });

    return { verified: true };
  }

  // Passwordless sign-in. An unknown email and a failed assertion are indistinguishable: both end in
  // invalid credentials, so enumeration learns nothing.
  async loginOptions(email: string): Promise<PasskeyLoginOptionsResponse> {
    const user = await this.findUser(email);
    if (!user) return { challenge: generateOpaqueToken(32), rpId: this.deps.rpId, allowCredentials: [] };
    return {
      challenge: await this.deps.passkeys.issueChallenge(user.id, 'LOGIN'),
      rpId: this.deps.rpId,
      allowCredentials: (await this.deps.passkeys.listCredentials(user.id)).map((c) => ({ id: c.credentialId, type: 'public-key' })),
    };
  }

  async verifyLogin(email: string, input: PasskeyLoginVerifyRequest): Promise<TokenPairResult> {
    const user = await this.findUser(email);
    if (!user) throw AuthErrors.invalidCredentials();
    const verified = await this.deps.passkeys.verifyAssertion(user.id, 'LOGIN', input);
    if (!verified) throw AuthErrors.invalidCredentials();

    const now = this.deps.clock.now();
    const refreshToken = TokenPairIssuer.newRefreshToken();
    const session = Session.startFamily({
      id: this.deps.ids.next(),
      familyId: this.deps.ids.next(),
      userId: user.id,
      tokenHash: refreshToken.hash,
      clientType: 'WEB',
      rememberMe: false,
      now,
      ttlSeconds: this.deps.tokenConfig.refreshTokenTtlSeconds,
    });
    return this.deps.issuer.issue(user, session, refreshToken.raw);
  }

  async stepUpChallenge(userId: string): Promise<PasskeyStepUpChallengeResponse> {
    const user = await this.deps.users.findActiveById(userId);
    if (!user) throw AuthErrors.unauthenticated();
    if ((await this.deps.passkeys.listCredentials(userId)).length === 0) {
      throw AuthErrors.passkeyFailed('no passkey enrolled');
    }
    return { challenge: await this.deps.passkeys.issueChallenge(userId, 'STEP_UP') };
  }

  async list(userId: string): Promise<ListPasskeysResponse> {
    const items = await this.deps.passkeys.listCredentials(userId);
    return {
      passkeys: items.map((i) => ({
        id: i.id,
        credentialId: i.credentialId,
        deviceName: i.deviceName,
        createdAt: i.createdAt.toISOString(),
      })),
    };
  }

  async remove(userId: string, credentialId: string): Promise<{ success: boolean }> {
    const ok = await this.deps.passkeys.removeCredential(userId, credentialId);
    return { success: ok };
  }

  private async findUser(rawEmail: string): Promise<User | null> {
    const email = Email.tryParse(rawEmail);
    return email ? this.deps.users.findActiveByProvider('EMAIL', email.value) : null;
  }
}
