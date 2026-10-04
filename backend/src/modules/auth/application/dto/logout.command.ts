export type LogoutCommand =
  | { readonly kind: 'SESSION'; readonly userId: string; readonly refreshToken: string }
  | { readonly kind: 'ALL'; readonly userId: string };
