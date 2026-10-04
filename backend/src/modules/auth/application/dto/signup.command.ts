export interface SignupCommand {
  readonly email: string;
  readonly password: string;
  readonly displayName: string | null;
}
