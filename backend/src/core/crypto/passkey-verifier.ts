import { createHash, createPublicKey, timingSafeEqual, verify, type KeyObject } from 'node:crypto';
import type { Collection, Db } from 'mongodb';
import { constantTimeEqual } from './constant-time-equal.ts';
import { generateOpaqueToken } from './random-token.ts';
import type { Clock } from '../time/clock.ts';

export interface PasskeyAssertionPayload {
  readonly credentialId: string;
  readonly clientDataJson: string;
  readonly authenticatorData: string;
  readonly signature: string;
}

export interface StoredPasskeyCredential {
  readonly id: string;
  readonly userId: string;
  readonly tenantId: string;
  readonly credentialId: string;
  readonly publicKeySpki: string;
  readonly deviceName: string;
  readonly transports: string[];
  readonly createdAt: Date;
  readonly lastUsedAt: Date | null;
  readonly counter?: number;
}

function toBuffer(input: string, encodingFallback: BufferEncoding = 'utf8'): Buffer {
  if (input.includes('{') || input.includes('webauthn')) {
    return Buffer.from(input, 'utf8');
  }
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = normalized.length % 4;
  const padded = pad ? normalized + '='.repeat(4 - pad) : normalized;
  try {
    return Buffer.from(padded, 'base64');
  } catch {
    return Buffer.from(input, encodingFallback);
  }
}

interface ParsedClientData {
  readonly type: string;
  readonly challenge: string;
  readonly origin: string;
}

function parseClientData(clientDataJson: string): ParsedClientData | null {
  try {
    const parsed = JSON.parse(toBuffer(clientDataJson, 'utf8').toString('utf8')) as unknown;
    if (typeof parsed !== 'object' || parsed === null) return null;
    const { type, challenge, origin } = parsed as Record<string, unknown>;
    if (typeof type !== 'string' || typeof challenge !== 'string' || typeof origin !== 'string') return null;
    return { type, challenge, origin };
  } catch {
    return null;
  }
}

function isLocalRp(rpId: string): boolean {
  return rpId === 'localhost' || rpId === '127.0.0.1' || rpId === '[::1]' || rpId.endsWith('.localhost');
}

// The port is not part of the relying party identity, so any port on the RP host is accepted.
function checkOrigin(origin: string, rpId: string): boolean {
  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }
  if (url.hostname !== rpId) return false;
  if (url.protocol === 'https:') return true;
  return url.protocol === 'http:' && isLocalRp(rpId);
}

// Registration runs inside an authenticated session, so the client-supplied key is bound to the account by
// checking the fresh challenge and origin rather than parsing the attestation certificate chain.
export function checkRegistrationClientData(
  clientDataJson: string,
  options: { rpId: string; expectedChallenge: string },
): boolean {
  const clientData = parseClientData(clientDataJson);
  return (
    !!clientData &&
    clientData.type === 'webauthn.create' &&
    constantTimeEqual(clientData.challenge, options.expectedChallenge) &&
    checkOrigin(clientData.origin, options.rpId)
  );
}

export type VerifyPasskeyResult = { readonly ok: true; readonly counter: number } | { readonly ok: false };

const FAILED = { ok: false } as const;

export function verifyPasskeyAssertion(
  credential: StoredPasskeyCredential,
  assertion: PasskeyAssertionPayload,
  options: { rpId: string; expectedChallenge: string },
): VerifyPasskeyResult {
  if (!assertion.credentialId || !assertion.signature || !assertion.authenticatorData || !assertion.clientDataJson) {
    return FAILED;
  }
  if (assertion.credentialId !== credential.credentialId) {
    return FAILED;
  }
  const clientData = parseClientData(assertion.clientDataJson);
  if (!clientData || clientData.type !== 'webauthn.get') {
    return FAILED;
  }
  if (!constantTimeEqual(clientData.challenge, options.expectedChallenge)) {
    return FAILED;
  }
  if (!checkOrigin(clientData.origin, options.rpId)) {
    return FAILED;
  }

  try {
    const clientDataBuf = toBuffer(assertion.clientDataJson, 'utf8');
    const clientDataHash = createHash('sha256').update(clientDataBuf).digest();

    const authDataBuf = toBuffer(assertion.authenticatorData, 'base64');
    if (authDataBuf.length < 37) {
      return FAILED;
    }
    if (!timingSafeEqual(authDataBuf.subarray(0, 32), createHash('sha256').update(options.rpId, 'utf8').digest())) {
      return FAILED;
    }

    // Authenticator flags byte is at index 32; bit 0 is User Present (UP).
    const flags = authDataBuf[32];
    if ((flags & 0x01) === 0) {
      return FAILED;
    }
    const counter = authDataBuf.readUInt32BE(33);
    const storedCounter = credential.counter ?? 0;
    // A repeated counter means the authenticator was cloned; the first assertion after registration is
    // exempt because some authenticators start at zero.
    if (counter <= storedCounter && storedCounter !== 0) {
      return FAILED;
    }

    const signedPayload = Buffer.concat([authDataBuf, clientDataHash]);
    const signatureBuf = toBuffer(assertion.signature, 'base64');

    const keyBuf = Buffer.from(credential.publicKeySpki, 'base64');
    let publicKey: KeyObject;
    try {
      publicKey = createPublicKey({ key: keyBuf, format: 'der', type: 'spki' });
    } catch {
      publicKey = createPublicKey(credential.publicKeySpki);
    }

    let isValid = verify('sha256', signedPayload, publicKey, signatureBuf);
    if (!isValid) {
      try {
        isValid = verify('sha256', signedPayload, { key: publicKey, dsaEncoding: 'ieee-p1363' }, signatureBuf);
      } catch {
        // unsupported dsa encoding fallback
      }
    }

    return isValid ? { ok: true, counter } : FAILED;
  } catch {
    return FAILED;
  }
}

export interface PasskeyStore {
  save(credential: StoredPasskeyCredential): Promise<void>;
  findByCredentialId(userId: string, credentialId: string): Promise<StoredPasskeyCredential | null>;
  listByUser(userId: string): Promise<StoredPasskeyCredential[]>;
  remove(userId: string, credentialId: string): Promise<boolean>;
}

export class MemoryPasskeyStore implements PasskeyStore {
  private readonly credentials = new Map<string, StoredPasskeyCredential>();

  async save(credential: StoredPasskeyCredential): Promise<void> {
    this.credentials.set(`${credential.userId}:${credential.credentialId}`, credential);
  }

  async findByCredentialId(userId: string, credentialId: string): Promise<StoredPasskeyCredential | null> {
    const key = `${userId}:${credentialId}`;
    if (this.credentials.has(key)) return this.credentials.get(key)!;
    for (const cred of this.credentials.values()) {
      if (cred.userId === userId && cred.credentialId === credentialId) return cred;
    }
    return null;
  }

  async listByUser(userId: string): Promise<StoredPasskeyCredential[]> {
    const list: StoredPasskeyCredential[] = [];
    for (const cred of this.credentials.values()) {
      if (cred.userId === userId) list.push(cred);
    }
    return list;
  }

  async remove(userId: string, credentialId: string): Promise<boolean> {
    const key = `${userId}:${credentialId}`;
    if (this.credentials.has(key)) {
      this.credentials.delete(key);
      return true;
    }
    for (const [k, cred] of this.credentials.entries()) {
      if (cred.userId === userId && cred.credentialId === credentialId) {
        this.credentials.delete(k);
        return true;
      }
    }
    return false;
  }
}

export class MongoPasskeyStore implements PasskeyStore {
  private readonly getCollection: () => Promise<Collection<any>>;

  constructor(getDb: () => Promise<Db>) {
    this.getCollection = async () => (await getDb()).collection('passkeys');
  }

  async save(credential: StoredPasskeyCredential): Promise<void> {
    const col = await this.getCollection();
    await col.updateOne(
      { userId: credential.userId, credentialId: credential.credentialId },
      { $set: credential },
      { upsert: true },
    );
  }

  async findByCredentialId(userId: string, credentialId: string): Promise<StoredPasskeyCredential | null> {
    const col = await this.getCollection();
    const doc = await col.findOne({ userId, credentialId });
    if (!doc) return null;
    return {
      id: doc.id || doc._id?.toString(),
      userId: doc.userId,
      tenantId: doc.tenantId,
      credentialId: doc.credentialId,
      publicKeySpki: doc.publicKeySpki,
      deviceName: doc.deviceName,
      transports: doc.transports ?? [],
      createdAt: doc.createdAt,
      lastUsedAt: doc.lastUsedAt ?? null,
      counter: doc.counter,
    };
  }

  async listByUser(userId: string): Promise<StoredPasskeyCredential[]> {
    const col = await this.getCollection();
    const docs = await col.find({ userId }).sort({ createdAt: -1 }).toArray();
    return docs.map((doc) => ({
      id: doc.id || doc._id?.toString(),
      userId: doc.userId,
      tenantId: doc.tenantId,
      credentialId: doc.credentialId,
      publicKeySpki: doc.publicKeySpki,
      deviceName: doc.deviceName,
      transports: doc.transports ?? [],
      createdAt: doc.createdAt,
      lastUsedAt: doc.lastUsedAt ?? null,
      counter: doc.counter,
    }));
  }

  async remove(userId: string, credentialId: string): Promise<boolean> {
    const col = await this.getCollection();
    const res = await col.deleteOne({ userId, credentialId });
    return (res.deletedCount ?? 0) > 0;
  }
}

export const PASSKEY_CHALLENGE_TYPES = ['REGISTRATION', 'LOGIN', 'STEP_UP'] as const;
export type PasskeyChallengeType = (typeof PASSKEY_CHALLENGE_TYPES)[number];

// The relying party id the browser checks the origin against. An explicit PASSKEY_RP_ID (or the earlier
// WEBAUTHN_RP_ID) wins; on Vercel the deployment hostname is used; local runs stay on localhost.
export function defaultRpId(explicit?: string): string {
  if (explicit) return explicit;
  if (process.env.WEBAUTHN_RP_ID) return process.env.WEBAUTHN_RP_ID;
  if (process.env.VERCEL_URL) {
    try {
      return new URL(`https://${process.env.VERCEL_URL}`).hostname;
    } catch {
      // Fall through to localhost below.
    }
  }
  return 'localhost';
}

export interface PasskeyChallenge {
  readonly userId: string;
  readonly type: PasskeyChallengeType;
  readonly challenge: string;
  readonly expiresAt: Date;
}

// Single-use WebAuthn challenges. Consuming deletes the record, so a signed ceremony cannot be replayed.
// Expiry is checked on read, so a stopped clock never revives a challenge.
export interface PasskeyChallengeStore {
  save(challenge: PasskeyChallenge): Promise<void>;
  consume(userId: string, type: PasskeyChallengeType): Promise<PasskeyChallenge | null>;
}

export class MemoryPasskeyChallengeStore implements PasskeyChallengeStore {
  private readonly challenges = new Map<string, PasskeyChallenge>();

  async save(challenge: PasskeyChallenge): Promise<void> {
    this.challenges.set(key(challenge.userId, challenge.type), challenge);
  }

  async consume(userId: string, type: PasskeyChallengeType): Promise<PasskeyChallenge | null> {
    const record = this.challenges.get(key(userId, type)) ?? null;
    this.challenges.delete(key(userId, type));
    return record;
  }
}

function key(userId: string, type: PasskeyChallengeType): string {
  return `${userId}:${type}`;
}

export class MongoPasskeyChallengeStore implements PasskeyChallengeStore {
  private readonly getCollection: () => Promise<Collection<any>>;

  constructor(getDb: () => Promise<Db>) {
    this.getCollection = async () => (await getDb()).collection('passkey_challenges');
  }

  async save(challenge: PasskeyChallenge): Promise<void> {
    const col = await this.getCollection();
    await col.updateOne(
      { userId: challenge.userId, type: challenge.type },
      {
        $set: { challenge: challenge.challenge, expiresAt: challenge.expiresAt, updatedAt: new Date() },
        $setOnInsert: { userId: challenge.userId, type: challenge.type, createdAt: new Date() },
      },
      { upsert: true },
    );
  }

  async consume(userId: string, type: PasskeyChallengeType): Promise<PasskeyChallenge | null> {
    const col = await this.getCollection();
    const doc = await col.findOneAndDelete({ userId, type });
    return doc ? { userId: doc.userId, type: doc.type, challenge: doc.challenge, expiresAt: doc.expiresAt } : null;
  }
}

export interface PasskeyService {
  verify(tenantId: string, userId: string, assertion: PasskeyAssertionPayload): Promise<boolean>;
  verifyAssertion(userId: string, type: PasskeyChallengeType, assertion: PasskeyAssertionPayload): Promise<boolean>;
  issueChallenge(userId: string, type: PasskeyChallengeType): Promise<string>;
  consumeChallenge(userId: string, type: PasskeyChallengeType): Promise<PasskeyChallenge | null>;
  saveCredential(credential: StoredPasskeyCredential): Promise<void>;
  listCredentials(userId: string): Promise<StoredPasskeyCredential[]>;
  removeCredential(userId: string, credentialId: string): Promise<boolean>;
}

export interface PasskeyServiceOptions {
  readonly challenges: PasskeyChallengeStore;
  readonly clock: Clock;
  readonly rpId: string;
  readonly challengeTtlSeconds: number;
}

export function createPasskeyService(store: PasskeyStore, options: PasskeyServiceOptions): PasskeyService {
  const { challenges, clock, rpId, challengeTtlSeconds } = options;

  async function consumeLiveChallenge(userId: string, type: PasskeyChallengeType): Promise<PasskeyChallenge | null> {
    const pending = await challenges.consume(userId, type);
    if (!pending || pending.expiresAt.getTime() <= clock.now().getTime()) return null;
    return pending;
  }

  return {
    // The wealth Tier-3 gate: only a fresh step-up challenge the server issued can authorize a trade.
    async verify(_tenantId: string, userId: string, assertion: PasskeyAssertionPayload): Promise<boolean> {
      return this.verifyAssertion(userId, 'STEP_UP', assertion);
    },
    async verifyAssertion(userId: string, type: PasskeyChallengeType, assertion: PasskeyAssertionPayload): Promise<boolean> {
      const pending = await consumeLiveChallenge(userId, type);
      if (!pending) return false;
      const cred = await store.findByCredentialId(userId, assertion.credentialId);
      if (!cred) return false;
      const result = verifyPasskeyAssertion(cred, assertion, { rpId, expectedChallenge: pending.challenge });
      if (!result.ok) return false;
      await store.save({ ...cred, counter: result.counter, lastUsedAt: clock.now() });
      return true;
    },
    async issueChallenge(userId: string, type: PasskeyChallengeType): Promise<string> {
      const challenge = generateOpaqueToken(32);
      await challenges.save({
        userId,
        type,
        challenge,
        expiresAt: new Date(clock.now().getTime() + challengeTtlSeconds * 1000),
      });
      return challenge;
    },
    async consumeChallenge(userId: string, type: PasskeyChallengeType): Promise<PasskeyChallenge | null> {
      return consumeLiveChallenge(userId, type);
    },
    async saveCredential(credential: StoredPasskeyCredential): Promise<void> {
      await store.save(credential);
    },
    async listCredentials(userId: string): Promise<StoredPasskeyCredential[]> {
      return store.listByUser(userId);
    },
    async removeCredential(userId: string, credentialId: string): Promise<boolean> {
      return store.remove(userId, credentialId);
    },
  };
}
