import { useSyncExternalStore } from 'react';
import {
  calculateBaseRiskScore,
  COUNTRY_CURRENCY_MAP,
  deriveCorridorCurrencies,
  deriveTimeHorizonYears,
  isCurrency,
  mapStressAnswerToRiskBand,
  type Currency,
  type ProfilingAnswersInput,
} from '@wealth-advisor/rules';

export interface ProfilingDraft {
  step: number;
  answers: ProfilingAnswersInput;
}

export interface ProfileState {
  answers: ProfilingAnswersInput;
  baseRiskScore: number;
  effectiveRiskBand: 'conservative' | 'moderate' | 'aggressive';
  timeHorizonYears: number;
  corridorCurrencies: string[];
  draft: ProfilingDraft | null;
  isCompleted: boolean;
  totalHoldings: number;
  preferredCurrency: Currency;
}

// Elena's baseline fixture profile used for the local demo / testing account.
export const DEFAULT_ELENA_PROFILE: ProfilingAnswersInput = {
  psychology: ['STEADY_GROWTH', 'MAX_GROWTH'],
  countries: {
    residence: 'DE',
    incomeSources: ['DE', 'GB'],
    remittanceDestinations: ['CN', 'SG'],
  },
  instruments: [
    'GLOBAL_EQUITIES',
    'TECH_GROWTH_EQUITIES',
    'GOVERNMENT_CORPORATE_BONDS',
    'MONEY_MARKET_CASH',
  ],
  holdings: {
    cashSavings: { amount: 15000, currency: 'EUR' },
    brokerageStocks: { amount: 57000, currency: 'EUR' },
    retirementPension: { amount: 23000, currency: 'EUR' },
    otherAssets: { amount: 0, currency: 'EUR' },
  },
  age: 31,
  goals: {
    tags: ['FAMILY_SUPPORT', 'EMERGENCY_BUFFER'],
    notes: 'Support parents in Shanghai and maintain family liquid runway.',
  },
  stressResponse: 'STAY_INVESTED',
};

// Clean initial empty profile for new real user signups.
export const INITIAL_EMPTY_PROFILE: ProfilingAnswersInput = {
  psychology: [],
  countries: {
    residence: '',
    incomeSources: [],
    remittanceDestinations: [],
  },
  instruments: [],
  holdings: {
    cashSavings: { amount: 0, currency: 'EUR' },
    brokerageStocks: { amount: 0, currency: 'EUR' },
    retirementPension: { amount: 0, currency: 'EUR' },
    otherAssets: { amount: 0, currency: 'EUR' },
  },
  age: 30,
  goals: {
    tags: [],
    notes: '',
  },
  stressResponse: 'STAY_INVESTED',
};

export function isDemoEmail(email?: string | null): boolean {
  if (!email) return true;
  return email.trim().toLowerCase() === 'testing@example.com';
}

export function getProfileStorageKey(email?: string | null): string {
  if (isDemoEmail(email)) {
    return 'dewa_profile_answers_demo';
  }
  return `dewa_profile_answers_${email!.trim().toLowerCase()}`;
}

export function getDraftStorageKey(email?: string | null): string {
  if (isDemoEmail(email)) {
    return 'dewa_profile_draft_demo';
  }
  return `dewa_profile_draft_${email!.trim().toLowerCase()}`;
}

export function getPreferredCurrencyStorageKey(email?: string | null): string {
  if (isDemoEmail(email)) {
    return 'dewa_preferred_currency_demo';
  }
  return `dewa_preferred_currency_${email!.trim().toLowerCase()}`;
}

function computeProfileState(
  answers: ProfilingAnswersInput,
  draft: ProfilingDraft | null,
  isCompleted: boolean,
  email?: string | null,
): ProfileState {
  const totalHoldings =
    answers.holdings.cashSavings.amount +
    answers.holdings.brokerageStocks.amount +
    answers.holdings.retirementPension.amount +
    answers.holdings.otherAssets.amount;

  let preferredCurrency: Currency;
  try {
    const prefKey = getPreferredCurrencyStorageKey(email);
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem(prefKey) : null;
    if (stored && isCurrency(stored)) {
      preferredCurrency = stored as Currency;
    } else {
      const residence = answers.countries.residence?.toUpperCase();
      preferredCurrency = (residence && COUNTRY_CURRENCY_MAP[residence]) || 'EUR';
    }
  } catch {
    const residence = answers.countries.residence?.toUpperCase();
    preferredCurrency = (residence && COUNTRY_CURRENCY_MAP[residence]) || 'EUR';
  }

  return {
    answers,
    baseRiskScore: calculateBaseRiskScore(answers),
    effectiveRiskBand: mapStressAnswerToRiskBand(answers.stressResponse),
    timeHorizonYears: deriveTimeHorizonYears(answers.age),
    corridorCurrencies: deriveCorridorCurrencies(answers.countries),
    draft,
    isCompleted,
    totalHoldings,
    preferredCurrency,
  };
}

export function loadStoredState(email?: string | null): ProfileState {
  const isDemo = isDemoEmail(email);
  const profileKey = getProfileStorageKey(email);
  const draftKey = getDraftStorageKey(email);

  let answers: ProfilingAnswersInput;
  let isCompleted: boolean;

  try {
    const rawProfile = typeof window !== 'undefined' ? window.localStorage.getItem(profileKey) : null;
    if (rawProfile) {
      answers = JSON.parse(rawProfile) as ProfilingAnswersInput;
      isCompleted = true;
    } else if (isDemo) {
      // Legacy demo key fallback
      const legacyProfile = typeof window !== 'undefined' ? window.localStorage.getItem('dewa_profile_answers_v1') : null;
      if (legacyProfile) {
        answers = JSON.parse(legacyProfile) as ProfilingAnswersInput;
      } else {
        answers = DEFAULT_ELENA_PROFILE;
      }
      isCompleted = true;
    } else {
      // Fresh non-demo user has no initial profile answers
      answers = INITIAL_EMPTY_PROFILE;
      isCompleted = false;
    }
  } catch {
    answers = isDemo ? DEFAULT_ELENA_PROFILE : INITIAL_EMPTY_PROFILE;
    isCompleted = isDemo;
  }

  let draft: ProfilingDraft | null = null;
  try {
    const rawDraft = typeof window !== 'undefined' ? window.sessionStorage.getItem(draftKey) : null;
    if (rawDraft) {
      draft = JSON.parse(rawDraft) as ProfilingDraft;
    }
  } catch {
    // Ignore invalid draft
  }

  return computeProfileState(answers, draft, isCompleted, email);
}

const stateCache = new Map<string, ProfileState>();
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeToProfile(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getProfileState(email?: string | null): ProfileState {
  const key = getProfileStorageKey(email);
  let state = stateCache.get(key);
  if (!state) {
    state = loadStoredState(email);
    stateCache.set(key, state);
  }
  return state;
}

export function hasCompletedProfile(email?: string | null): boolean {
  return getProfileState(email).isCompleted;
}

export function saveProfile(answers: ProfilingAnswersInput, email?: string | null): void {
  const profileKey = getProfileStorageKey(email);
  const draftKey = getDraftStorageKey(email);

  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(profileKey, JSON.stringify(answers));
      window.sessionStorage.removeItem(draftKey);
      if (isDemoEmail(email)) {
        window.localStorage.setItem('dewa_profile_answers_v1', JSON.stringify(answers));
      }
    }
  } catch {
    // Continue even if storage quota fails
  }

  const newState = computeProfileState(answers, null, true, email);
  stateCache.set(profileKey, newState);
  emit();
}

export function setPreferredCurrency(currency: Currency, email?: string | null): void {
  const prefKey = getPreferredCurrencyStorageKey(email);
  const profileKey = getProfileStorageKey(email);

  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(prefKey, currency);
    }
  } catch {
    // Continue even if storage quota fails
  }

  const prev = getProfileState(email);
  const newState: ProfileState = {
    ...prev,
    preferredCurrency: currency,
  };
  stateCache.set(profileKey, newState);
  emit();
}

export function saveDraft(step: number, answers: ProfilingAnswersInput, email?: string | null): void {
  const draftKey = getDraftStorageKey(email);
  const profileKey = getProfileStorageKey(email);
  const draft: ProfilingDraft = { step, answers };

  try {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(draftKey, JSON.stringify(draft));
    }
  } catch {
    // Continue even if storage quota fails
  }

  const prev = getProfileState(email);
  const newState: ProfileState = {
    ...prev,
    draft,
  };
  stateCache.set(profileKey, newState);
  emit();
}

export function clearDraft(email?: string | null): void {
  const draftKey = getDraftStorageKey(email);
  const profileKey = getProfileStorageKey(email);

  try {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(draftKey);
    }
  } catch {
    // Continue
  }

  const prev = getProfileState(email);
  const newState: ProfileState = {
    ...prev,
    draft: null,
  };
  stateCache.set(profileKey, newState);
  emit();
}

export function wipeUserDataFromBrowser(email?: string | null): void {
  try {
    if (typeof window !== 'undefined') {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (
          key &&
          (key.startsWith('dewa_profile_') ||
            key.startsWith('dewa_preferred_currency_') ||
            key === 'dewa_profile_answers_v1')
        ) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => window.localStorage.removeItem(key));

      const sessionKeysToRemove: string[] = [];
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const key = window.sessionStorage.key(i);
        if (key && (key.startsWith('dewa_profile_') || key.startsWith('dewa_draft_'))) {
          sessionKeysToRemove.push(key);
        }
      }
      sessionKeysToRemove.forEach((key) => window.sessionStorage.removeItem(key));

      stateCache.clear();
    }
  } catch {
    // Continue
  }
  emit();
}

export function useProfile(email?: string | null): ProfileState {
  return useSyncExternalStore(subscribeToProfile, () => getProfileState(email));
}
