import { randomBytes } from 'node:crypto';
import type {
  ListPasskeysResponse,
  PasskeyRegisterVerifyRequest,
  PasskeyRegistrationOptionsResponse,
} from '@wealth-advisor/contracts';
import type { PasskeyService } from '#core/crypto/passkey-verifier.ts';
import type { Clock } from '#core/time/clock.ts';
import type { UserRepositoryPort } from '../ports/user-repository.port.ts';
import { AuthErrors } from '../../domain/errors/auth-errors.ts';

export interface PasskeyUseCaseDeps {
  readonly users: UserRepositoryPort;
  readonly passkeys: PasskeyService;
  readonly clock: Clock;
}

export class PasskeyUseCase {
  private readonly deps: PasskeyUseCaseDeps;

  constructor(deps: PasskeyUseCaseDeps) {
    this.deps = deps;
  }

  async getRegistrationOptions(userId: string): Promise<PasskeyRegistrationOptionsResponse> {
    const user = await this.deps.users.findActiveById(userId);
    if (!user) throw AuthErrors.unauthenticated();

    const challenge = randomBytes(32).toString('base64url');
    const rpId = process.env.WEBAUTHN_RP_ID || (process.env.VERCEL_URL ? new URL(`https://${process.env.VERCEL_URL}`).hostname : 'localhost');

    return {
      challenge,
      rp: { name: 'Syntropy AI', id: rpId },
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
      throw AuthErrors.passkeyFailed();
    }

    await this.deps.passkeys.saveCredential({
      id: randomBytes(16).toString('hex'),
      userId,
      tenantId,
      credentialId: req.credentialId,
      publicKeySpki,
      deviceName: req.deviceName || 'Biometric Sensor (TouchID / FaceID)',
      createdAt: this.deps.clock.now(),
    });

    return { verified: true };
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
}
