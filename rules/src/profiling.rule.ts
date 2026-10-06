// Seven onboarding profiling questions and deterministic risk scoring.
// Sources:
// - Kahneman & Tversky (1979) Prospect Theory: Loss aversion (lambda ~ 2.25) dictates asymmetric panic under 25% drawdowns.
// - Grable & Lytton (1999) Financial Risk Tolerance Assessment: Multi-dimensional psychological risk scale.
// - CFA Institute Standards of Practice Handbook (Wealth Planning): Ability vs willingness to bear risk.

import type { Currency } from './currency.rule.ts';

export const PROFILING_PSYCHOLOGY_OPTIONS = [
  'PROTECT_CAPITAL',
  'STEADY_GROWTH',
  'MAX_GROWTH',
  'SUSTAINABLE_IMPACT',
] as const;
export type ProfilingPsychologyOption = (typeof PROFILING_PSYCHOLOGY_OPTIONS)[number];

export const PROFILING_INSTRUMENT_OPTIONS = [
  'GLOBAL_EQUITIES',
  'TECH_GROWTH_EQUITIES',
  'GOVERNMENT_CORPORATE_BONDS',
  'MONEY_MARKET_CASH',
  'FX_HEDGING',
] as const;
export type ProfilingInstrumentOption = (typeof PROFILING_INSTRUMENT_OPTIONS)[number];

export const PROFILING_GOAL_TAGS = [
  'RETIREMENT',
  'HOME_PURCHASE',
  'CHILD_EDUCATION',
  'FAMILY_SUPPORT',
  'EMERGENCY_BUFFER',
] as const;
export type ProfilingGoalTag = (typeof PROFILING_GOAL_TAGS)[number];

export const PROFILING_STRESS_OPTIONS = [
  'CUT_RISK',
  'STAY_INVESTED',
  'BUY_MORE',
] as const;
export type ProfilingStressOption = (typeof PROFILING_STRESS_OPTIONS)[number];

export type ProfilingRiskBand = 'conservative' | 'moderate' | 'aggressive';

export interface HoldingBucketInput {
  amount: number;
  currency: Currency;
}

export interface ProfilingHoldingsInput {
  cashSavings: HoldingBucketInput;
  brokerageStocks: HoldingBucketInput;
  retirementPension: HoldingBucketInput;
  otherAssets: HoldingBucketInput;
}

export interface CorridorCountriesInput {
  residence: string;
  incomeSources: string[];
  remittanceDestinations: string[];
}

export interface ProfilingAnswersInput {
  psychology: ProfilingPsychologyOption[];
  countries: CorridorCountriesInput;
  instruments: ProfilingInstrumentOption[];
  holdings: ProfilingHoldingsInput;
  age: number;
  goals: {
    tags: ProfilingGoalTag[];
    notes: string;
  };
  stressResponse: ProfilingStressOption;
}

export const PROFILING_MIN_AGE = 18;
export const PROFILING_MAX_AGE = 100;

export const PROFILING_QUESTIONS = [
  { id: 'psychology', promptKey: 'profiling.q1.prompt', type: 'multi_choice' },
  { id: 'countries', promptKey: 'profiling.q2.prompt', type: 'corridor_countries' },
  { id: 'instruments', promptKey: 'profiling.q3.prompt', type: 'multi_choice' },
  { id: 'holdings', promptKey: 'profiling.q4.prompt', type: 'holdings_buckets' },
  { id: 'age', promptKey: 'profiling.q5.prompt', type: 'number' },
  { id: 'goals', promptKey: 'profiling.q6.prompt', type: 'goals_tags' },
  { id: 'stressResponse', promptKey: 'profiling.q7.prompt', type: 'single_choice' },
] as const;

export function mapStressAnswerToRiskBand(answer: ProfilingStressOption): ProfilingRiskBand {
  switch (answer) {
    case 'CUT_RISK':
      return 'conservative';
    case 'STAY_INVESTED':
      return 'moderate';
    case 'BUY_MORE':
      return 'aggressive';
  }
}

export function deriveTimeHorizonYears(age: number): number {
  if (!Number.isFinite(age) || age < PROFILING_MIN_AGE) return 40;
  if (age >= 75) return 5;
  // Standard retirement horizon targeting age 65, minimum 5 years.
  return Math.max(5, 65 - age);
}

// Maps country codes to their default expat operational currency.
const COUNTRY_CURRENCY_MAP: Record<string, Currency> = {
  DE: 'EUR',
  FR: 'EUR',
  ES: 'EUR',
  NL: 'EUR',
  IT: 'EUR',
  IE: 'EUR',
  GB: 'GBP',
  US: 'USD',
  SG: 'SGD',
  CN: 'CNY',
  JP: 'JPY',
  HK: 'HKD',
};

export function deriveCorridorCurrencies(countries: CorridorCountriesInput): Currency[] {
  const allCountryCodes = [
    countries.residence,
    ...countries.incomeSources,
    ...countries.remittanceDestinations,
  ];
  const currencies = new Set<Currency>();
  for (const code of allCountryCodes) {
    const currency = COUNTRY_CURRENCY_MAP[code.toUpperCase()];
    if (currency) {
      currencies.add(currency);
    }
  }
  if (currencies.size === 0) {
    currencies.add('EUR');
  }
  return Array.from(currencies);
}

// Computes a deterministic base risk score between 1.0 (lowest risk) and 10.0 (highest risk).
export function calculateBaseRiskScore(answers: ProfilingAnswersInput): number {
  let score = 5.0;

  // 1. Psychological traits
  if (answers.psychology.includes('PROTECT_CAPITAL')) score -= 2.0;
  if (answers.psychology.includes('STEADY_GROWTH')) score += 0.5;
  if (answers.psychology.includes('MAX_GROWTH')) score += 2.5;

  // 2. Time horizon based on age
  const horizon = deriveTimeHorizonYears(answers.age);
  if (horizon >= 25) score += 1.0;
  else if (horizon < 10) score -= 1.0;

  // 3. Stress question adjustment (loss aversion cross-check)
  switch (answers.stressResponse) {
    case 'CUT_RISK':
      score -= 2.0;
      break;
    case 'STAY_INVESTED':
      // Neutral
      break;
    case 'BUY_MORE':
      score += 1.5;
      break;
  }

  // 4. Instrument willingness
  if (answers.instruments.includes('TECH_GROWTH_EQUITIES')) score += 0.5;
  if (answers.instruments.includes('MONEY_MARKET_CASH') && !answers.instruments.includes('GLOBAL_EQUITIES')) {
    score -= 1.0;
  }

  // Clamp score strictly between 1.0 and 10.0 rounded to one decimal place.
  const clamped = Math.max(1.0, Math.min(10.0, score));
  return Math.round(clamped * 10) / 10;
}
