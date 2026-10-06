import { ADVISORY_ERROR_CODES, type AdvisoryErrorCode } from '@wealth-advisor/rules';

export const ADVISORY_ERROR_STATUSES: Readonly<Record<AdvisoryErrorCode, number>> = {
  [ADVISORY_ERROR_CODES.gatewayUnavailable]: 503,
  [ADVISORY_ERROR_CODES.unsupportedModel]: 400,
  [ADVISORY_ERROR_CODES.invariantViolated]: 500,
};
