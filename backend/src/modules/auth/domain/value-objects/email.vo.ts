import { isEmail, normalizeEmail } from '@wealth-advisor/rules';
import type { ValueRule } from '#core/domain/value-rule.ts';
import { ValueObject } from '#core/domain/value-object.ts';
import { invariant } from '#core/domain/invariant.ts';
import { AuthErrors } from '../errors/auth-errors.ts';

const EMAIL_RULE: ValueRule<string> = { normalize: normalizeEmail, check: isEmail, reject: AuthErrors.invalidEmail };

// Normalized email; also the EMAIL provider's subject. The format rule is the shared one from @wealth-advisor/rules.
export class Email extends ValueObject<string> {
  static of(raw: string): Email {
    return ValueObject.fromInput(EMAIL_RULE, raw, (value) => new Email(value));
  }

  static tryParse(raw: string): Email | null {
    return isEmail(normalizeEmail(raw)) ? Email.of(raw) : null;
  }

  // Stored emails skip the creation rule, so tightening it never locks existing users out.
  static restore(stored: string): Email {
    return ValueObject.fromStored(stored, (value) => new Email(value));
  }

  protected override postInit(): void {
    invariant(this.value.includes('@'), () => AuthErrors.invariantViolated('email has no @'));
  }
}
