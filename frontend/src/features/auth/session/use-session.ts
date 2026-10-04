import { useSyncExternalStore } from 'react';
import { type SessionStatus, getSessionStatus, subscribeToSession } from './session-store.ts';

export function useSessionStatus(): SessionStatus {
  return useSyncExternalStore(subscribeToSession, getSessionStatus);
}
