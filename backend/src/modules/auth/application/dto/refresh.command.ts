// The client type and rememberMe are inherited from the session being rotated, so only the token is needed.
export interface RefreshCommand {
  readonly refreshToken: string;
}
