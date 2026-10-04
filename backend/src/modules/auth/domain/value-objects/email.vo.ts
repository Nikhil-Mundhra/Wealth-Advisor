import { ValueObject } from '#core/domain/value-object.ts';
import { AuthErrors } from '../errors/auth-errors.ts';

const MAX_LENGTH = 255;
const PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Trimmed, lowercased email. Also the EMAIL provider's subject, like cochika's normalized provider_user_id.
export class Email extends ValueObject<string> {
  static of(raw: string): Email {
    return ValueObject.finalize(new Email(raw.trim().toLowerCase()));
  }

  protected override postInit(): void {
    if (this.value.length > MAX_LENGTH || !PATTERN.test(this.value)) throw AuthErrors.invalidEmail();
  }
}
