import type { LoginRequest, SignupRequest } from '@wealth-advisor/contracts';
import type { LoginCommand } from '../../application/dto/login.command.ts';
import type { SignupCommand } from '../../application/dto/signup.command.ts';

export function toSignupCommand(request: SignupRequest): SignupCommand {
  return { email: request.email, password: request.password, displayName: request.displayName ?? null };
}

export function toLoginCommand(request: LoginRequest): LoginCommand {
  return { email: request.email, password: request.password, clientType: request.clientType, rememberMe: request.rememberMe };
}
