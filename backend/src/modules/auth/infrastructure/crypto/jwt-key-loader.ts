import { generateKeyPair, importPKCS8, importSPKI } from 'jose';
import { AuthErrors } from '../../domain/errors/auth-errors.ts';

const ALGORITHM = 'EdDSA';

type SigningKey = Awaited<ReturnType<typeof importPKCS8>>;

export interface SigningKeys {
  readonly privateKey: SigningKey;
  readonly publicKey: SigningKey;
}

export interface KeySource {
  readonly privateKeyPem?: string;
  readonly publicKeyPem?: string;
  // Development only: without configured keys, generate a throwaway pair (tokens die on restart).
  readonly allowEphemeral: boolean;
}

// Env vars usually carry PEM line breaks escaped as "\n".
const unescapePem = (pem: string): string => pem.replace(/\\n/g, '\n');

// Loads the Ed25519 key pair from PEM, or generates an ephemeral one where that is allowed.
export async function loadSigningKeys(source: KeySource): Promise<SigningKeys> {
  if (source.privateKeyPem && source.publicKeyPem) {
    return {
      privateKey: await importPKCS8(unescapePem(source.privateKeyPem), ALGORITHM),
      publicKey: await importSPKI(unescapePem(source.publicKeyPem), ALGORITHM),
    };
  }
  if (source.privateKeyPem || source.publicKeyPem || !source.allowEphemeral) throw AuthErrors.signingKeysMissing();
  console.warn('[auth] using an ephemeral Ed25519 key pair; tokens will not survive a restart');
  return generateKeyPair(ALGORITHM, { crv: 'Ed25519' });
}
