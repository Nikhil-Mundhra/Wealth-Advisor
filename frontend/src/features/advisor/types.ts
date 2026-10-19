import type { AssetClass, Currency, HouseholdMode, RunwayBand } from '@wealth-advisor/rules';
import type { ProfilingAnswersInput } from '@wealth-advisor/rules';

export interface PreMeetingBrief {
  headline: string;
  summary: string;
  runwayStatus: string;
  driftAlert?: string;
  fxShockAlert?: string;
  recommendedAgenda: string[];
  proposedActions: string[];
}

export interface ClientHolding {
  assetClass: AssetClass;
  symbol: string;
  label: string;
  weight: number;
  targetWeight: number;
  value: number;
  currency: Currency;
}

export interface ClientAccount {
  id: string;
  label: string;
  currency: Currency;
  balance: number;
  institution?: string;
}

export interface ClientRemittance {
  corridor: string;
  amount: string;
  frequency: string;
  note: string;
}

export interface AdvisorClient {
  id: string;
  name: string;
  email: string;
  avatarIndex: number;
  location: string;
  householdMode: HouseholdMode;
  baseCurrency: Currency;
  netWorth: number;
  netWorthSeries: number[];
  liquidReserves: number;
  runwayMonths: number;
  runwayBand: RunwayBand;
  monthlyBurn: number;
  riskScore: number;
  riskBand: 'conservative' | 'moderate' | 'aggressive';
  driftAlert?: string;
  accounts: ClientAccount[];
  holdings: ClientHolding[];
  remittances: ClientRemittance[];
  profileAnswers: ProfilingAnswersInput;
  preMeetingBrief: PreMeetingBrief;
}

export interface InstitutionalInstrument {
  ticker: string;
  isin: string;
  name: string;
  assetClass: AssetClass;
  category: 'Equities' | 'Fixed Income' | 'Money Market' | 'FX Overlay';
  ter: number; // e.g. 0.07 for 0.07%
  yieldPct: number;
  aumEurB: number;
  domicile: string;
  currency: Currency;
  distributionPolicy: 'Accumulating' | 'Distributing';
  replication: 'Physical' | 'Synthetic';
  bestFor: string;
  taxEfficiencyNote: string;
}
