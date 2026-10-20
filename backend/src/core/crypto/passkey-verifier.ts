import { createHash, createPublicKey, verify, type KeyObject } from 'node:crypto';
import type { Collection, Db } from 'mongodb';

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
  readonly createdAt: Date;
  counter?: number;
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

export function verifyPasskeyAssertion(
  credential: StoredPasskeyCredential,
  assertion: PasskeyAssertionPayload,
): boolean {
  if (!assertion.credentialId || !assertion.signature || !assertion.authenticatorData || !assertion.clientDataJson) {
    return false;
  }
  if (assertion.credentialId !== credential.credentialId) {
    return false;
  }

  try {
    const clientDataBuf = toBuffer(assertion.clientDataJson, 'utf8');
    const clientDataHash = createHash('sha256').update(clientDataBuf).digest();

    const authDataBuf = toBuffer(assertion.authenticatorData, 'base64');
    if (authDataBuf.length < 37) {
      return false;
    }

    // Authenticator flags byte is at index 32; bit 0 is User Present (UP).
    const flags = authDataBuf[32];
    if ((flags & 0x01) === 0) {
      return false;
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

    return isValid;
  } catch {
    return false;
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
      createdAt: doc.createdAt,
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
      createdAt: doc.createdAt,
      counter: doc.counter,
    }));
  }

  async remove(userId: string, credentialId: string): Promise<boolean> {
    const col = await this.getCollection();
    const res = await col.deleteOne({ userId, credentialId });
    return (res.deletedCount ?? 0) > 0;
  }
}

export interface PasskeyService {
  verify(tenantId: string, userId: string, assertion: PasskeyAssertionPayload): Promise<boolean>;
  saveCredential(credential: StoredPasskeyCredential): Promise<void>;
  listCredentials(userId: string): Promise<StoredPasskeyCredential[]>;
  removeCredential(userId: string, credentialId: string): Promise<boolean>;
}

export function createPasskeyService(store: PasskeyStore): PasskeyService {
  return {
    async verify(_tenantId: string, userId: string, assertion: PasskeyAssertionPayload): Promise<boolean> {
      const cred = await store.findByCredentialId(userId, assertion.credentialId);
      if (!cred) {
        return false;
      }
      return verifyPasskeyAssertion(cred, assertion);
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
