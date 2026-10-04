import { isPasswordLength } from '@wealth-advisor/rules';
import { AuthErrors } from '../errors/auth-errors.ts';

// The password rule for every writer, not only HTTP signup (the contract repeats it there for field messages).
export function assertPasswordAllowed(password: string): void {
  if (!isPasswordLength(password)) throw AuthErrors.weakPassword();
}
