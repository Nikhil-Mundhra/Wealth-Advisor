import { ADMIN_ERROR_CODES, type AdminErrorCode } from '@wealth-advisor/rules';
import { DomainError } from '#core/domain/domain-error.ts';

export class AdminErrors {
  static tenantNotFound(id: string): DomainError {
    return new DomainError(ADMIN_ERROR_CODES.tenantNotFound, `tenant ${id} not found`);
  }

  static slugTaken(slug: string): DomainError {
    return new DomainError(ADMIN_ERROR_CODES.slugTaken, `tenant slug ${slug} is already taken`);
  }

  static apiKeyNotFound(id: string): DomainError {
    return new DomainError(ADMIN_ERROR_CODES.apiKeyNotFound, `api key ${id} not found`);
  }

  static unauthorized(): DomainError {
    return new DomainError(ADMIN_ERROR_CODES.unauthorized, 'unauthorized: admin role required');
  }

  static invalidProvider(provider: string): DomainError {
    return new DomainError(ADMIN_ERROR_CODES.invalidProvider, `invalid llm provider ${provider}`);
  }

  static userNotFound(id: string): DomainError {
    return new DomainError(ADMIN_ERROR_CODES.userNotFound, `user ${id} not found`);
  }

  static emailTaken(email: string): DomainError {
    return new DomainError(ADMIN_ERROR_CODES.emailTaken, `email ${email} is already in use`);
  }

  static cannotDeleteSelf(): DomainError {
    return new DomainError(ADMIN_ERROR_CODES.cannotDeleteSelf, 'cannot delete or withdraw the currently logged-in admin user');
  }

  static invariantViolated(detail: string): DomainError {
    return new DomainError(ADMIN_ERROR_CODES.invariantViolated, detail);
  }
}
