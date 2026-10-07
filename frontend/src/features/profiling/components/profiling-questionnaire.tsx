import { useState } from 'react';
import {
  rankRelevantCurrencies,
  listHoldingAmounts,
  type CorridorCountriesInput,
  type Currency,
  type HoldingKind,
  type HoldingsByCurrency,
  type ProfilingAnswersInput,
  type ProfilingGoalTag,
  type ProfilingInstrumentOption,
  type ProfilingPsychologyOption,
  type ProfilingStressOption,
} from '@wealth-advisor/rules';
import { Button } from '../../../components/ui/button.tsx';
import { useStrings } from '../../../lib/dictionaries.ts';
import { CountryTagInput } from './country-tag-input.tsx';
import { INITIAL_EMPTY_PROFILE, saveDraft, saveProfile, useProfile } from '../profile-store.ts';

interface ProfilingQuestionnaireProps {
  onComplete: () => void;
  onCancel?: () => void;
  email?: string | null;
  startFresh?: boolean;
}

const TOTAL_STEPS = 7;

export function ProfilingQuestionnaire({ onComplete, onCancel, email, startFresh = false }: ProfilingQuestionnaireProps) {
  const strings = useStrings();
  const profile = useProfile(email);

  // Initialize from draft if available, otherwise from existing profile
  const initialStep = profile.draft ? profile.draft.step : 1;
  const initialAnswers: ProfilingAnswersInput = profile.draft
    ? profile.draft.answers
    : startFresh ? INITIAL_EMPTY_PROFILE : profile.answers;

  const [step, setStep] = useState(initialStep);
  const [answers, setAnswers] = useState<ProfilingAnswersInput>(initialAnswers);
  const [error, setError] = useState<string | null>(null);

  const rankedCurrencies = rankRelevantCurrencies(answers.countries);
  const holdingCurrencies: Currency[] = Array.from(new Set<Currency>([
    ...rankedCurrencies.filter(({ reason }) => reason === 'residence' || reason === 'income').map(({ currency }) => currency),
    ...Object.keys(answers.holdingsByCurrency ?? {}) as Currency[],
    ...(!answers.holdingsByCurrency ? Object.values(answers.holdings).map((holding) => holding.currency) : []),
  ]));

  const updateAnswers = (updater: (prev: ProfilingAnswersInput) => ProfilingAnswersInput) => {
    setError(null);
    setAnswers((prev) => {
      const next = updater(prev);
      saveDraft(step, next, email);
      return next;
    });
  };

  const handleNext = () => {
    // Validation per step
    if (step === 1 && answers.psychology.length === 0) {
      setError(strings['profiling.q1.prompt']);
      return;
    }
    if (step === 2 && !answers.countries.residence.trim()) {
      setError(strings['profiling.q2.prompt']);
      return;
    }
    if (step === 3 && answers.instruments.length === 0) {
      setError(strings['profiling.q3.prompt']);
      return;
    }
    if (step === 5 && (answers.age < 18 || answers.age > 100)) {
      setError(strings['profiling.q5.prompt']);
      return;
    }

    if (step < TOTAL_STEPS) {
      const nextStep = step + 1;
      setStep(nextStep);
      saveDraft(nextStep, answers, email);
    } else {
      // Step 7 complete: persist
      saveProfile(answers, email);
      onComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      const prevStep = step - 1;
      setStep(prevStep);
      saveDraft(prevStep, answers, email);
    } else if (onCancel) {
      onCancel();
    }
  };

  const togglePsychology = (option: ProfilingPsychologyOption) => {
    updateAnswers((prev) => {
      const exists = prev.psychology.includes(option);
      return {
        ...prev,
        psychology: exists
          ? prev.psychology.filter((item) => item !== option)
          : [...prev.psychology, option],
      };
    });
  };

  const toggleInstrument = (option: ProfilingInstrumentOption) => {
    updateAnswers((prev) => {
      const exists = prev.instruments.includes(option);
      return {
        ...prev,
        instruments: exists
          ? prev.instruments.filter((item) => item !== option)
          : [...prev.instruments, option],
      };
    });
  };

  const toggleGoalTag = (tag: ProfilingGoalTag) => {
    updateAnswers((prev) => {
      const exists = prev.goals.tags.includes(tag);
      return {
        ...prev,
        goals: {
          ...prev.goals,
          tags: exists ? prev.goals.tags.filter((item) => item !== tag) : [...prev.goals.tags, tag],
        },
      };
    });
  };

  const updateCountries = (partial: Partial<CorridorCountriesInput>) => {
    updateAnswers((prev) => ({
      ...prev,
      countries: {
        ...prev.countries,
        ...partial,
      },
    }));
  };

  const updateCurrencyHolding = (currency: Currency, bucket: HoldingKind, value: string) => {
    updateAnswers((prev) => {
      const existing: HoldingsByCurrency = prev.holdingsByCurrency ?? listHoldingAmounts(prev).reduce<HoldingsByCurrency>(
        (rows, holding) => ({
          ...rows,
          [holding.currency]: { ...rows[holding.currency], [holding.bucket]: holding.amount },
        }),
        {},
      );
      return {
        ...prev,
        holdingsByCurrency: {
          ...existing,
          [currency]: {
            ...existing[currency],
            [bucket]: value === '' ? undefined : Number(value),
          },
        },
      };
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Progress header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-subtle">
          <span>
            {strings['profiling.step']} {step} {strings['profiling.of']} {TOTAL_STEPS}
          </span>
          {profile.draft && (
            <span className="text-brand-700 dark:text-brand-900 font-medium">
              {strings['profiling.resumed']}
            </span>
          )}
        </div>
        <div
          role="progressbar"
          aria-label={strings['profiling.title']}
          aria-valuenow={step}
          aria-valuemin={1}
          aria-valuemax={TOTAL_STEPS}
          className="h-1.5 w-full overflow-hidden rounded-full bg-surface-subtle"
        >
          <div
            className="h-full rounded-full bg-brand-600 transition-all duration-300"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </div>

      {/* Step 1: Investor Psychology */}
      {step === 1 && (
        <div className="flex flex-col gap-3">
          <div>
            <h3 className="font-semibold text-base">{strings['profiling.q1.prompt']}</h3>
            <p className="text-xs text-subtle mt-0.5">{strings['profiling.q1.subtext']}</p>
          </div>
          <div className="flex flex-col gap-2">
            {[
              { id: 'PROTECT_CAPITAL' as const, label: strings['profiling.q1.opt.protect'] },
              { id: 'STEADY_GROWTH' as const, label: strings['profiling.q1.opt.steady'] },
              { id: 'MAX_GROWTH' as const, label: strings['profiling.q1.opt.max'] },
              { id: 'SUSTAINABLE_IMPACT' as const, label: strings['profiling.q1.opt.impact'] },
            ].map(({ id, label }) => {
              const selected = answers.psychology.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => togglePsychology(id)}
                  aria-pressed={selected}
                  className={`rounded-field border p-3 text-left text-sm transition-colors min-h-[44px] ${
                    selected
                      ? 'border-brand-600 bg-brand-600/10 font-medium text-brand-900 dark:text-brand-100'
                      : 'border-line bg-surface hover:bg-surface-subtle text-ink'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 2: Countries and Currencies */}
      {step === 2 && (
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="font-semibold text-base">{strings['profiling.q2.prompt']}</h3>
            <p className="text-xs text-subtle mt-0.5">{strings['profiling.q2.subtext']}</p>
          </div>
          <div className="flex flex-col gap-4">
            <CountryTagInput
              id="country-residence"
              label={strings['profiling.q2.residence']}
              value={answers.countries.residence}
              onChange={(code: string) => updateCountries({ residence: code })}
              multiple={false}
              placeholder="Search residence country (e.g. DE, GB, SG, US)…"
              hint="Primary corridor"
            />
            <CountryTagInput
              id="country-income"
              label={strings['profiling.q2.income']}
              value={answers.countries.incomeSources}
              onChange={(codes: string[]) => updateCountries({ incomeSources: codes })}
              multiple={true}
              placeholder="Search income countries (e.g. DE, GB)…"
              hint="Multiple allowed"
            />
            <CountryTagInput
              id="country-remit"
              label={strings['profiling.q2.remittance']}
              value={answers.countries.remittanceDestinations}
              onChange={(codes: string[]) => updateCountries({ remittanceDestinations: codes })}
              multiple={true}
              placeholder="Search remittance countries (e.g. CN, SG, IN)…"
              hint="Multiple allowed"
            />
          </div>
        </div>
      )}

      {/* Step 3: Investment Instruments */}
      {step === 3 && (
        <div className="flex flex-col gap-3">
          <div>
            <h3 className="font-semibold text-base">{strings['profiling.q3.prompt']}</h3>
            <p className="text-xs text-subtle mt-0.5">{strings['profiling.q3.subtext']}</p>
          </div>
          <div className="flex flex-col gap-2">
            {[
              { id: 'GLOBAL_EQUITIES' as const, label: strings['profiling.q3.opt.global'] },
              { id: 'TECH_GROWTH_EQUITIES' as const, label: strings['profiling.q3.opt.tech'] },
              { id: 'GOVERNMENT_CORPORATE_BONDS' as const, label: strings['profiling.q3.opt.bonds'] },
              { id: 'MONEY_MARKET_CASH' as const, label: strings['profiling.q3.opt.money_market'] },
              { id: 'FX_HEDGING' as const, label: strings['profiling.q3.opt.fx_hedge'] },
            ].map(({ id, label }) => {
              const selected = answers.instruments.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleInstrument(id)}
                  aria-pressed={selected}
                  className={`rounded-field border p-3 text-left text-sm transition-colors min-h-[44px] ${
                    selected
                      ? 'border-brand-600 bg-brand-600/10 font-medium text-brand-900 dark:text-brand-100'
                      : 'border-line bg-surface hover:bg-surface-subtle text-ink'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 4: Current Holdings */}
      {step === 4 && (
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="font-semibold text-base">{strings['profiling.q4.prompt']}</h3>
            <p className="text-xs text-subtle mt-0.5">{strings['profiling.q4.subtext']}</p>
          </div>
          {holdingCurrencies.map((currency) => (
            <fieldset key={currency} className="rounded-field border border-line p-4">
              <legend className="px-1 text-sm font-semibold text-ink">{currency}</legend>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {([
                  ['cashSavings', strings['profiling.q4.cash']],
                  ['brokerageStocks', strings['profiling.q4.brokerage']],
                  ['retirementPension', strings['profiling.q4.pension']],
                  ['otherAssets', strings['profiling.q4.other']],
                ] as const).map(([bucket, label]) => {
                  const legacyHolding = answers.holdings[bucket];
                  const amount = answers.holdingsByCurrency
                    ? answers.holdingsByCurrency[currency]?.[bucket]
                    : legacyHolding.currency === currency ? legacyHolding.amount : undefined;
                  return (
                    <div key={bucket}>
                      <label htmlFor={`holding-${currency}-${bucket}`} className="mb-1 block text-xs font-medium text-subtle">
                        {label} ({currency})
                      </label>
                      <input
                        id={`holding-${currency}-${bucket}`}
                        type="number"
                        min="0"
                        value={amount ?? ''}
                        onChange={(event) => updateCurrencyHolding(currency, bucket, event.target.value)}
                        className="w-full rounded-field border border-line bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-brand-600 min-h-[44px]"
                      />
                    </div>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>
      )}

      {/* Step 5: Age & Horizon */}
      {step === 5 && (
        <div className="flex flex-col gap-3">
          <div>
            <h3 className="font-semibold text-base">{strings['profiling.q5.prompt']}</h3>
            <p className="text-xs text-subtle mt-0.5">{strings['profiling.q5.subtext']}</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="18"
              max="100"
              value={answers.age}
              onChange={(e) => updateAnswers((prev) => ({ ...prev, age: Number(e.target.value) || 18 }))}
              className="w-24 rounded-field border border-line bg-surface px-3 py-2 text-base text-ink focus:outline-none focus:ring-1 focus:ring-brand-600 min-h-[44px]"
            />
            <span className="text-sm font-medium">{strings['profiling.q5.years']}</span>
          </div>
        </div>
      )}

      {/* Step 6: Goals and Milestones */}
      {step === 6 && (
        <div className="flex flex-col gap-3">
          <div>
            <h3 className="font-semibold text-base">{strings['profiling.q6.prompt']}</h3>
            <p className="text-xs text-subtle mt-0.5">{strings['profiling.q6.subtext']}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'RETIREMENT' as const, label: strings['profiling.q6.opt.retirement'] },
              { id: 'HOME_PURCHASE' as const, label: strings['profiling.q6.opt.home'] },
              { id: 'CHILD_EDUCATION' as const, label: strings['profiling.q6.opt.education'] },
              { id: 'FAMILY_SUPPORT' as const, label: strings['profiling.q6.opt.family'] },
              { id: 'EMERGENCY_BUFFER' as const, label: strings['profiling.q6.opt.buffer'] },
            ].map(({ id, label }) => {
              const selected = answers.goals.tags.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleGoalTag(id)}
                  aria-pressed={selected}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors min-h-[36px] ${
                    selected
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-line bg-surface hover:bg-surface-subtle text-ink'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="mt-2">
            <label htmlFor="goal-notes" className="text-xs font-medium text-subtle block mb-1">
              {strings['profiling.q6.notes']}
            </label>
            <textarea
              id="goal-notes"
              rows={2}
              maxLength={500}
              value={answers.goals.notes}
              onChange={(e) => updateAnswers((prev) => ({ ...prev, goals: { ...prev.goals, notes: e.target.value } }))}
              className="w-full rounded-field border border-line bg-surface p-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-brand-600"
            />
          </div>
        </div>
      )}

      {/* Step 7: Stress Question */}
      {step === 7 && (
        <div className="flex flex-col gap-3">
          <div>
            <h3 className="font-semibold text-base">{strings['profiling.q7.prompt']}</h3>
            <p className="text-xs text-subtle mt-0.5">{strings['profiling.q7.subtext']}</p>
          </div>
          <div className="flex flex-col gap-2">
            {[
              { id: 'CUT_RISK' as const, label: strings['profiling.q7.opt.cut'] },
              { id: 'STAY_INVESTED' as const, label: strings['profiling.q7.opt.stay'] },
              { id: 'BUY_MORE' as const, label: strings['profiling.q7.opt.buy'] },
            ].map(({ id, label }) => {
              const selected = answers.stressResponse === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => updateAnswers((prev) => ({ ...prev, stressResponse: id }))}
                  aria-pressed={selected}
                  className={`rounded-field border p-3.5 text-left text-sm transition-colors min-h-[48px] ${
                    selected
                      ? 'border-brand-600 bg-brand-600/10 font-medium text-brand-900 dark:text-brand-100 ring-1 ring-brand-600'
                      : 'border-line bg-surface hover:bg-surface-subtle text-ink'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-danger font-medium">{error}</p>}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-line">
        <Button variant="outline" onClick={handleBack} className="min-h-[44px]">
          {strings['profiling.back']}
        </Button>
        <Button variant="primary" onClick={handleNext} className="min-h-[44px]">
          {step === TOTAL_STEPS ? strings['profiling.finish'] : strings['profiling.next']}
        </Button>
      </div>
    </div>
  );
}
