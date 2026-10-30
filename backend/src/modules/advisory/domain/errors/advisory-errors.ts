import { DomainError } from '#core/domain/domain-error.ts';
import { ADVISORY_ERROR_CODES } from '@wealth-advisor/rules';

export const AdvisoryErrors = {
  gatewayUnavailable: (detail?: string) =>
    new DomainError(
      ADVISORY_ERROR_CODES.gatewayUnavailable,
      detail ? `advisory gateway unavailable: ${detail}` : 'advisory gateway unavailable',
    ),
  unsupportedModel: (model: string) =>
    new DomainError(ADVISORY_ERROR_CODES.unsupportedModel, `unsupported model: ${model}`),
  unknownTool: (tool: string) =>
    new DomainError(ADVISORY_ERROR_CODES.unsupportedModel, `unsupported advisory tool: ${tool}`),
  tierForbidden: (tool: string, tier: string) =>
    new DomainError(ADVISORY_ERROR_CODES.tierForbidden, `advisory tool ${tool} requires ${tier}`),
  invariantViolated: (detail: string) =>
    new DomainError(ADVISORY_ERROR_CODES.invariantViolated, `advisory invariant violated: ${detail}`),
};
