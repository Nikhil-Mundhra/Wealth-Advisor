import { exportPKCS8, exportSPKI, generateKeyPair } from 'jose';

// Prints a fresh Ed25519 key pair as single-line env entries for .env.local or the Vercel dashboard.
const { privateKey, publicKey } = await generateKeyPair('EdDSA', { crv: 'Ed25519', extractable: true });
const oneLine = (pem: string): string => pem.trim().replace(/\n/g, '\\n');
console.log(`AUTH_JWT_PRIVATE_KEY="${oneLine(await exportPKCS8(privateKey))}"`);
console.log(`AUTH_JWT_PUBLIC_KEY="${oneLine(await exportSPKI(publicKey))}"`);
