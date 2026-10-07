# Planned collections

Status: no new collections are planned; the changes below are not built. Built collections: `backend/docs/collections.md`.

## Changes to built collections

- `users`: + `householdMode: 'INDIVIDUAL' | 'FAMILY_HOUSEHOLD'`, `preferredLocale: 'en' | 'zh-CN' | 'zh-HK' | 'de'`, `preferredTheme: 'DARK' | 'LIGHT' | 'SYSTEM'`, `passkeys: PasskeyCredential[]`; provider type + `PASSKEY`; roles `EXPAT | ADMIN | COMPLIANCE_OFFICER` (replaces `USER`).
- `users` indexes: provider uniqueness scoped by tenant `{ tenantId, providers.type, providers.subject }` (unique, partial `status: 'ACTIVE'`); `{ passkeys.credentialId }` (unique, sparse); `{ tenantId, status }`.
- `sessions`: + `tenantId`, `fingerprintHash`.
- `asset_products` indexes: `{ assetClass, riskRating }`.
- `sandbox_ledgers` indexes: `{ tenantId, userId, timestamp: -1 }`.

```typescript
interface PasskeyCredential {
  credentialId: string; // base64url
  publicKey: string; // base64url
  counter: number; // signature counter
  deviceType: 'SINGLE_DEVICE' | 'MULTI_DEVICE';
  backedUp: boolean;
  transports: Array<'USB' | 'NFC' | 'BLE' | 'INTERNAL' | 'HYBRID'>;
  deviceName: string;
  createdAt: Date;
  lastUsedAt: Date | null;
}
```
