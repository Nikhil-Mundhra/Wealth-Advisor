import type { PasskeyVerifier } from '../../application/ports.ts';

// No passkey registration exists yet, so no stored public key can check an assertion: every assertion is refused.
export const unregisteredPasskeyVerifier: PasskeyVerifier = {
  async verify() {
    return false;
  },
};
