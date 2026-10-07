export interface AccessTokenClaims {
  readonly subject: string;
  readonly roles: readonly string[];
  // The tenant the token is scoped to. Null for a user provisioned before tenant scoping; the caller then resolves to
  // the default tenant rather than reading across every tenant.
  readonly tenantId: string | null;
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
