import { useSyncExternalStore } from 'react';
import type { AdvisorClient } from './types.ts';
import { SEEDED_CLIENTS } from './clients-data.ts';
import type { ProfilingAnswersInput } from '@wealth-advisor/rules';

const STORAGE_KEY_CLIENT_ID = 'syntropy_advisor_active_client_id';

let clients: AdvisorClient[] = [...SEEDED_CLIENTS];
let activeClientId: string = (() => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const saved = window.localStorage.getItem(STORAGE_KEY_CLIENT_ID);
    if (saved && clients.some((c) => c.id === saved)) {
      return saved;
    }
  }
  return clients[0]?.id ?? 'elena-vance';
})();

const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeToAdvisorStore(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getActiveClientId(): string {
  return activeClientId;
}

export function getActiveClient(): AdvisorClient {
  return clients.find((c) => c.id === activeClientId) || clients[0]!;
}

export function listAdvisorClients(): AdvisorClient[] {
  return clients;
}

export function setActiveClient(clientId: string): void {
  const found = clients.find((c) => c.id === clientId);
  if (!found) return;
  activeClientId = clientId;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_KEY_CLIENT_ID, clientId);
    } catch {
      // Ignore storage write issues
    }
  }
  notify();
}

export function updateClientProfileAnswers(clientId: string, answers: ProfilingAnswersInput): void {
  clients = clients.map((client) => {
    if (client.id !== clientId) return client;
    return {
      ...client,
      profileAnswers: answers,
    };
  });
  notify();
}

export function useActiveClient(): AdvisorClient {
  return useSyncExternalStore(subscribeToAdvisorStore, getActiveClient, getActiveClient);
}

export function useAdvisorClients(): AdvisorClient[] {
  return useSyncExternalStore(subscribeToAdvisorStore, listAdvisorClients, listAdvisorClients);
}
