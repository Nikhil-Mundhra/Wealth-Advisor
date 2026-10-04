import { ApiError, NETWORK_ERROR_CODE } from '../../lib/api-error.ts';

export interface AuthErrorView {
  field?: 'email' | 'password';
  message: string;
}

// Turns an API error into something to show: under a field when it concerns one, otherwise for the form.
export function mapAuthError(error: unknown): AuthErrorView {
  if (error instanceof ApiError) {
    switch (error.code) {
      case 'AU_1001':
        return { field: 'email', message: 'An account with this email already exists.' };
      case 'AU_1006':
        return { field: 'email', message: 'Enter a valid email address.' };
      case 'AU_1002':
        return { message: 'Email or password is incorrect.' };
      case 'CORE_VALIDATION_FAILED':
        return { message: 'Some details are invalid. Check the form and try again.' };
      case NETWORK_ERROR_CODE:
        return { message: "Can't reach the server. Check your connection and try again." };
    }
  }
  return { message: 'Something went wrong on our side. Please try again.' };
}
