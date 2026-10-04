export interface AccessTokenClaims {
  readonly subject: string;
  readonly roles: readonly string[];
}

export interface SignedAccessToken {
  readonly token: string;
  readonly expiresIn: number;
}

export interface AccessTokenSignerPort {
  sign(claims: AccessTokenClaims): Promise<SignedAccessToken>;
  // Throws AuthErrors.unauthenticated() for any invalid, expired or foreign token.
  verify(token: string): Promise<AccessTokenClaims>;
}
