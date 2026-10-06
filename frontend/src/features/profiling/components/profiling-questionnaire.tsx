import { useState } from 'react';
import type {
  CorridorCountriesInput,
  HoldingBucketInput,
  ProfilingAnswersInput,
  ProfilingGoalTag,
  ProfilingHoldingsInput,
  ProfilingInstrumentOption,
  ProfilingPsychologyOption,
  ProfilingStressOption,
} from '@wealth-advisor/rules';
import { Button } from '../../../components/ui/button.tsx';
import { useStrings } from '../../../lib/dictionaries.ts';
import { saveDraft, saveProfile, useProfile } from '../profile-store.ts';

interface ProfilingQuestionnaireProps {
  onComplete: () => void;
  onCancel?: () => void;
  email?: string | null;
}

const TOTAL_STEPS = 7;

export function ProfilingQuestionnaire({ onComplete, onCancel, email }: ProfilingQuestionnaireProps) {
  const strings = useStrings();
  const profile = useProfile(email);

  // Initialize from draft if available, otherwise from existing profile
  const initialStep = profile.draft ? profile.draft.step : 1;
  const initialAnswers: ProfilingAnswersInput = profile.draft ? profile.draft.answers : profile.answers;

  const [step, setStep] = useState(initialStep);
  const [answers, setAnswers] = useState<ProfilingAnswersInput>(initialAnswers);
  const [error, setError] = useState<string | null>(null);

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

  const updateHoldingBucket = (bucket: keyof ProfilingHoldingsInput, field: Partial<HoldingBucketInput>) => {
    updateAnswers((prev) => ({
      ...prev,
      holdings: {
        ...prev.holdings,
        [bucket]: {
          ...prev.holdings[bucket],
          ...field,
        },
      },
    }));
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
        <div className="flex flex-col gap-3">
          <div>
            <h3 className="font-semibold text-base">{strings['profiling.q2.prompt']}</h3>
            <p className="text-xs text-subtle mt-0.5">{strings['profiling.q2.subtext']}</p>
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <label htmlFor="country-residence" className="text-xs font-medium text-subtle block mb-1">
                {strings['profiling.q2.residence']}
              </label>
              <input
                id="country-residence"
                type="text"
                value={answers.countries.residence}
                onChange={(e) => updateCountries({ residence: e.target.value.toUpperCase() })}
                placeholder="e.g. DE, GB, SG, AE, US"
                className="w-full rounded-field border border-line bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-brand-600 min-h-[44px]"
              />
            </div>
            <div>
              <label htmlFor="country-income" className="text-xs font-medium text-subtle block mb-1">
                {strings['profiling.q2.income']}
              </label>
              <input
                id="country-income"
                type="text"
                value={answers.countries.incomeSources.join(', ')}
                onChange={(e) =>
                  updateCountries({
                    incomeSources: e.target.value.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean),
                  })
                }
                placeholder="e.g. DE, GB"
                className="w-full rounded-field border border-line bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-brand-600 min-h-[44px]"
              />
            </div>
            <div>
              <label htmlFor="country-remit" className="text-xs font-medium text-subtle block mb-1">
                {strings['profiling.q2.remittance']}
              </label>
              <input
                id="country-remit"
                type="text"
                value={answers.countries.remittanceDestinations.join(', ')}
                onChange={(e) =>
                  updateCountries({
                    remittanceDestinations: e.target.value.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean),
                  })
                }
                placeholder="e.g. CN, SG, IN"
                className="w-full rounded-field border border-line bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-brand-600 min-h-[44px]"
              />
            </div>
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
        <div className="flex flex-col gap-3">
          <div>
            <h3 className="font-semibold text-base">{strings['profiling.q4.prompt']}</h3>
            <p className="text-xs text-subtle mt-0.5">{strings['profiling.q4.subtext']}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <label htmlFor="holding-cash" className="text-xs font-medium text-subtle block mb-1">
                {strings['profiling.q4.cash']}
              </label>
              <input
                id="holding-cash"
                type="number"
                min="0"
                value={answers.holdings.cashSavings.amount}
                onChange={(e) => updateHoldingBucket('cashSavings', { amount: Number(e.target.value) || 0 })}
                className="w-full rounded-field border border-line bg-surface px-3 py-2 text-ink focus:outline-none focus:ring-1 focus:ring-brand-600 min-h-[44px]"
              />
            </div>
            <div>
              <label htmlFor="holding-brokerage" className="text-xs font-medium text-subtle block mb-1">
                {strings['profiling.q4.brokerage']}
              </label>
              <input
                id="holding-brokerage"
                type="number"
                min="0"
                value={answers.holdings.brokerageStocks.amount}
                onChange={(e) => updateHoldingBucket('brokerageStocks', { amount: Number(e.target.value) || 0 })}
                className="w-full rounded-field border border-line bg-surface px-3 py-2 text-ink focus:outline-none focus:ring-1 focus:ring-brand-600 min-h-[44px]"
              />
            </div>
            <div>
              <label htmlFor="holding-pension" className="text-xs font-medium text-subtle block mb-1">
                {strings['profiling.q4.pension']}
              </label>
              <input
                id="holding-pension"
                type="number"
                min="0"
                value={answers.holdings.retirementPension.amount}
                onChange={(e) => updateHoldingBucket('retirementPension', { amount: Number(e.target.value) || 0 })}
                className="w-full rounded-field border border-line bg-surface px-3 py-2 text-ink focus:outline-none focus:ring-1 focus:ring-brand-600 min-h-[44px]"
              />
            </div>
            <div>
              <label htmlFor="holding-other" className="text-xs font-medium text-subtle block mb-1">
                {strings['profiling.q4.other']}
              </label>
              <input
                id="holding-other"
                type="number"
                min="0"
                value={answers.holdings.otherAssets.amount}
                onChange={(e) => updateHoldingBucket('otherAssets', { amount: Number(e.target.value) || 0 })}
                className="w-full rounded-field border border-line bg-surface px-3 py-2 text-ink focus:outline-none focus:ring-1 focus:ring-brand-600 min-h-[44px]"
              />
            </div>
          </div>
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
