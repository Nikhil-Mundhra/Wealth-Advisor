import type { ObjectId } from 'mongodb';
import type { LlmProvider } from '@wealth-advisor/rules';

export const ADMIN_SETTINGS_COLLECTION = 'admin_settings';

export interface AdminSettingsDocument {
  _id: ObjectId;
  key: string;
  activeLlmProvider: LlmProvider;
  updatedAt: Date;
}
