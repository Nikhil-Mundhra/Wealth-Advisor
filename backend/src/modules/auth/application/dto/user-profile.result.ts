export interface UserProfileResult {
  readonly id: string;
  readonly email: string;
  readonly displayName: string | null;
  readonly roles: readonly string[];
  readonly emailVerified: boolean;
  readonly createdAt: Date;
}
