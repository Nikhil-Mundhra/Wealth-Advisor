import { z } from 'zod';
import { REFRESH_TOKEN_PATTERN, VALIDATION_KEYS as K } from '@wealth-advisor/rules';

export const RefreshTokenField = z.string({ error: K.refreshTokenInvalid }).regex(REFRESH_TOKEN_PATTERN, { error: K.refreshTokenInvalid });
