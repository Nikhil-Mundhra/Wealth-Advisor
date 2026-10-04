import { z } from 'zod';

// Which client is calling; decides whether the refresh token travels in a cookie (WEB) or the body.
export const ClientType = z.enum(['WEB', 'IOS', 'ANDROID']);
export type ClientType = z.infer<typeof ClientType>;
