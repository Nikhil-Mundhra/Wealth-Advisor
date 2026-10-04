import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto';
import type { PasswordHasherPort } from '../../application/ports/password-hasher.port.ts';

// scrypt from Node's standard library: no native addon to bundle, so it behaves the same locally and on Vercel.
// Parameters follow OWASP's scrypt guidance (N=2^17, r=8, p=1, ~128 MiB). They are stored inside each hash,
// so they can be raised later without breaking existing passwords.
const PARAMS = { N: 2 ** 17, r: 8, p: 1 };
const KEY_LENGTH = 32;
const SALT_BYTES = 16;
const PREFIX = 'scrypt';

const maxmemFor = (N: number, r: number): number => 256 * N * r; // 2x the 128*N*r scrypt needs

function derive(password: string, salt: Buffer, params: { N: number; r: number; p: number }, keyLength: number): Promise<Buffer> {
  const options: ScryptOptions = { ...params, maxmem: maxmemFor(params.N, params.r) };
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keyLength, options, (error, key) => (error ? reject(error) : resolve(key)));
  });
}

// Stored format: scrypt$N$r$p$<salt base64>$<key base64>
export class ScryptPasswordHasher implements PasswordHasherPort {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(SALT_BYTES);
    const key = await derive(password, salt, PARAMS, KEY_LENGTH);
    return [PREFIX, PARAMS.N, PARAMS.r, PARAMS.p, salt.toString('base64'), key.toString('base64')].join('$');
  }

  async verify(passwordHash: string, password: string): Promise<boolean> {
    const [prefix, n, r, p, saltB64, keyB64] = passwordHash.split('$');
    if (prefix !== PREFIX || !saltB64 || !keyB64) return false; // a malformed stored hash fails closed
    const expected = Buffer.from(keyB64, 'base64');
    try {
      const actual = await derive(password, Buffer.from(saltB64, 'base64'), { N: Number(n), r: Number(r), p: Number(p) }, expected.length);
      return timingSafeEqual(actual, expected);
    } catch {
      return false;
    }
  }
}
