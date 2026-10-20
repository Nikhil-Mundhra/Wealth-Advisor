import { z } from 'zod';

export const PasskeyRegistrationOptionsResponse = z.object({
  challenge: z.string(),
  rp: z.object({ name: z.string(), id: z.string() }),
  user: z.object({ id: z.string(), name: z.string(), displayName: z.string() }),
  pubKeyCredParams: z.array(z.object({ alg: z.number(), type: z.string() })),
});
export type PasskeyRegistrationOptionsResponse = z.infer<typeof PasskeyRegistrationOptionsResponse>;

export const PasskeyRegisterVerifyRequest = z.object({
  credentialId: z.string(),
  clientDataJson: z.string(),
  attestationObject: z.string(),
  deviceName: z.string().optional(),
  publicKeySpki: z.string().optional(),
});
export type PasskeyRegisterVerifyRequest = z.infer<typeof PasskeyRegisterVerifyRequest>;

export const PasskeyCredentialDto = z.object({
  id: z.string(),
  credentialId: z.string(),
  deviceName: z.string(),
  createdAt: z.string(),
});
export type PasskeyCredentialDto = z.infer<typeof PasskeyCredentialDto>;

export const ListPasskeysResponse = z.object({
  passkeys: z.array(PasskeyCredentialDto),
});
export type ListPasskeysResponse = z.infer<typeof ListPasskeysResponse>;

export const PasskeyLoginOptionsRequest = z.object({
  email: z.string().min(1),
});
export type PasskeyLoginOptionsRequest = z.infer<typeof PasskeyLoginOptionsRequest>;

export const PasskeyLoginOptionsResponse = z.object({
  challenge: z.string(),
  rpId: z.string(),
  allowCredentials: z.array(z.object({ id: z.string(), type: z.string() })).optional(),
});
export type PasskeyLoginOptionsResponse = z.infer<typeof PasskeyLoginOptionsResponse>;

export const PasskeyLoginVerifyRequest = z.object({
  credentialId: z.string(),
  clientDataJson: z.string(),
  authenticatorData: z.string(),
  signature: z.string(),
});
export type PasskeyLoginVerifyRequest = z.infer<typeof PasskeyLoginVerifyRequest>;

export const PasskeyLoginVerifyWithEmailRequest = PasskeyLoginVerifyRequest.extend({
  email: z.string().min(1),
});
export type PasskeyLoginVerifyWithEmailRequest = z.infer<typeof PasskeyLoginVerifyWithEmailRequest>;

export const PasskeyStepUpChallengeResponse = z.object({
  challenge: z.string(),
});
export type PasskeyStepUpChallengeResponse = z.infer<typeof PasskeyStepUpChallengeResponse>;

export const PasskeyStepUpVerifyRequest = z.object({
  credentialId: z.string(),
  clientDataJson: z.string(),
  authenticatorData: z.string(),
  signature: z.string(),
});
export type PasskeyStepUpVerifyRequest = z.infer<typeof PasskeyStepUpVerifyRequest>;

export const PasskeyStepUpVerifyResponse = z.object({
  verified: z.boolean(),
  assertionProof: z.string(),
});
export type PasskeyStepUpVerifyResponse = z.infer<typeof PasskeyStepUpVerifyResponse>;
