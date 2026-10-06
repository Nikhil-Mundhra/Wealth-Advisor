import { z } from 'zod';
import {
  PROFILING_GOAL_TAGS,
  PROFILING_INSTRUMENT_OPTIONS,
  PROFILING_MAX_AGE,
  PROFILING_MIN_AGE,
  PROFILING_PSYCHOLOGY_OPTIONS,
  PROFILING_RISK_BANDS,
  PROFILING_STRESS_OPTIONS,
  VALIDATION_KEYS as K,
} from '@wealth-advisor/rules';
import { CurrencyField } from '../fields/currency.field.ts';

export const HoldingBucketSchema = z.object({
  amount: z.number().min(0, { message: K.profilingAmountNegative }),
  currency: CurrencyField,
});
export type HoldingBucket = z.infer<typeof HoldingBucketSchema>;

export const ProfilingHoldingsSchema = z.object({
  cashSavings: HoldingBucketSchema,
  brokerageStocks: HoldingBucketSchema,
  retirementPension: HoldingBucketSchema,
  otherAssets: HoldingBucketSchema,
});
export type ProfilingHoldings = z.infer<typeof ProfilingHoldingsSchema>;

export const CorridorCountriesSchema = z.object({
  residence: z.string().min(1, { message: K.profilingResidenceRequired }),
  incomeSources: z.array(z.string()),
  remittanceDestinations: z.array(z.string()),
});
export type CorridorCountries = z.infer<typeof CorridorCountriesSchema>;

export const ProfilingGoalsSchema = z.object({
  tags: z.array(z.enum(PROFILING_GOAL_TAGS)),
  notes: z.string().max(500).default(''),
});
export type ProfilingGoals = z.infer<typeof ProfilingGoalsSchema>;

export const ProfilingAnswersSchema = z.object({
  psychology: z
    .array(z.enum(PROFILING_PSYCHOLOGY_OPTIONS))
    .min(1, { message: K.profilingPsychologyRequired }),
  countries: CorridorCountriesSchema,
  instruments: z
    .array(z.enum(PROFILING_INSTRUMENT_OPTIONS))
    .min(1, { message: K.profilingInstrumentsRequired }),
  holdings: ProfilingHoldingsSchema,
  age: z
    .number()
    .int()
    .min(PROFILING_MIN_AGE, { message: K.profilingAgeInvalid })
    .max(PROFILING_MAX_AGE, { message: K.profilingAgeInvalid }),
  goals: ProfilingGoalsSchema,
  stressResponse: z.enum(PROFILING_STRESS_OPTIONS, {
    error: K.profilingStressRequired,
  }),
});
export type ProfilingAnswers = z.infer<typeof ProfilingAnswersSchema>;

export const ProfileSummarySchema = z.object({
  baseRiskScore: z.number(),
  effectiveRiskBand: z.enum(PROFILING_RISK_BANDS),
  timeHorizonYears: z.number(),
  corridorCurrencies: z.array(CurrencyField),
  completedAt: z.string(),
});
export type ProfileSummary = z.infer<typeof ProfileSummarySchema>;
