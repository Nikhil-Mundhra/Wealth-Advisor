import type { ValueRule } from '#core/domain/value-rule.ts';
import { ValueObject } from '#core/domain/value-object.ts';
import { AuthErrors } from '../errors/auth-errors.ts';

export const TOKEN_HASH_PATTERN = /^[0-9a-f]{64}$/;

const TOKEN_HASH_RULE: ValueRule<string> = {
  check: (value) => TOKEN_HASH_PATTERN.test(value),
  reject: () => AuthErrors.invariantViolated('token hash must be 64 lowercase hex characters'),
};

// The only form of a refresh token the server keeps: SHA-256 hex of the raw token.
export class TokenHash extends ValueObject<string> {
  static of(hex: string): TokenHash {
    return ValueObject.fromInput(TOKEN_HASH_RULE, hex, (value) => new TokenHash(value));
  }
}
