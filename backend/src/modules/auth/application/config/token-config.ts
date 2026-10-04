// Token lifetimes the use cases run with; filled from env by the composition root.
export interface TokenConfig {
  readonly refreshTokenTtlSeconds: number;
  readonly reuseGraceSeconds: number;
}
