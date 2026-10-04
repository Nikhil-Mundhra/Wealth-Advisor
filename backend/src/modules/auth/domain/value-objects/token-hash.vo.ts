import { ValueObject } from '#core/domain/value-object.ts';
import { AuthErrors } from '../errors/auth-errors.ts';

const SHA256_HEX = /^[0-9a-f]{64}$/;

// The only form of a refresh token the server keeps: SHA-256 hex of the raw token.
export class TokenHash extends ValueObject<string> {
  static of(hex: string): TokenHash {
    return ValueObject.finalize(new TokenHash(hex));
  }

  protected override postInit(): void {
    if (!SHA256_HEX.test(this.value)) throw AuthErrors.invariantViolated('token hash must be 64 lowercase hex characters');
  }
}
