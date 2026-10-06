import { SHARING_ERROR_CODES, type SharingErrorCode } from '@wealth-advisor/rules';

export const SHARING_ERROR_STATUSES: Readonly<Record<SharingErrorCode, number>> = {
  [SHARING_ERROR_CODES.planNotFound]: 404,
  [SHARING_ERROR_CODES.planExpired]: 410,
  [SHARING_ERROR_CODES.invariantViolated]: 500,
};
