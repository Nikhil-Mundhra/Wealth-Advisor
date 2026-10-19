import { useState, useEffect } from 'react';
import {
  Award,
  CheckCircle2,
  Cpu,
  KeyRound,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../components/ui/button.tsx';
import { Card } from '../../components/ui/card.tsx';
import { Input } from '../../components/ui/input.tsx';
import { PageTitle } from '../../components/ui/page-title.tsx';
import {
  detectProvider,
  getActiveModelSpec,
  resetToDefault,
  saveAiConfig,
  useAiConfig,
} from '../../features/ai-config/ai-settings-store.ts';
import { CodeSnippets } from '../../features/ai-config/components/code-snippets.tsx';
import { ModelCard } from '../../features/ai-config/components/model-card.tsx';
import { ToastNotification } from '../../features/ai-config/components/toast-notification.tsx';
import { FINANCE_BENCH_MODELS, TOP_FREE_MODEL_ID } from '../../features/ai-config/models-data.ts';
import type { AiProvider } from '../../features/ai-config/types.ts';
import { cn } from '../../lib/cn.ts';
import { SettingsNav } from './settings-nav.tsx';

export function AiSettingsPage() {
  const currentConfig = useAiConfig();

  // Local form state pre-populated from current config so it never looks empty
  const [keyInput, setKeyInput] = useState(currentConfig.apiKey);
  const [selectedProvider, setSelectedProvider] = useState<AiProvider>(
    currentConfig.isCustom ? currentConfig.provider : 'openrouter',
  );
  const [selectedModelId, setSelectedModelId] = useState<string>(
    currentConfig.selectedModelId || TOP_FREE_MODEL_ID,
  );
  const [showToast, setShowToast] = useState(false);
  const [lastSavedModelName, setLastSavedModelName] = useState('');

  // Keep form synced if stored config changes externally
  useEffect(() => {
    if (currentConfig.apiKey) {
      setKeyInput(currentConfig.apiKey);
      setSelectedProvider(currentConfig.provider);
      setSelectedModelId(currentConfig.selectedModelId);
    }
  }, [currentConfig]);

  const handleKeyChange = (val: string) => {
    setKeyInput(val);
    if (val.trim()) {
      const autoProvider = detectProvider(val);
      setSelectedProvider(autoProvider);
      // If user pasted an OpenRouter key and hasn't picked a model, default to the top free model
      if (autoProvider === 'openrouter' && !currentConfig.isCustom) {
        setSelectedModelId(TOP_FREE_MODEL_ID);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = keyInput.trim();

    const saved = saveAiConfig({
      apiKey: cleanKey,
      selectedModelId,
      provider: selectedProvider,
    });

    const activeSpec = getActiveModelSpec(saved.selectedModelId);
    setLastSavedModelName(activeSpec.name);
    setShowToast(true);
  };

  const handleReset = () => {
    resetToDefault();
    setKeyInput('');
    setSelectedProvider('openrouter');
    setSelectedModelId(TOP_FREE_MODEL_ID);
    setShowToast(false);
  };

  const activeModelSpec = getActiveModelSpec(currentConfig.selectedModelId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <PageTitle>AI &amp; Model Configuration</PageTitle>
        <p className="mt-1 text-xs text-subtle">
          Configure custom provider API keys or rely on the platform default gateway. Models are sorted by FinanceBench Factual Correctness %.
        </p>
      </div>

      <SettingsNav />

      {/* PERMANENT ACTIVE STATUS CARD (Never appears empty) */}
      <Card className="flex flex-col gap-4 border-line bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
          <div className="flex items-center gap-2.5">
            {currentConfig.isCustom ? (
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                <CheckCircle2 aria-hidden className="size-3.5" />
                <span>Active Custom Gateway</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 rounded-full bg-brand-600/15 px-3 py-1 text-xs font-semibold text-brand-700 dark:text-brand-900 border border-brand-600/20">
                <Sparkles aria-hidden className="size-3.5" />
                <span>Platform Default Gateway Active</span>
              </span>
            )}
            <span className="text-xs text-subtle">
              Fiduciary Gateway: <strong className="text-ink">{currentConfig.isCustom ? currentConfig.provider : 'Syntropy Core'}</strong>
            </span>
          </div>

          {currentConfig.isCustom && (
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs h-8"
            >
              <RotateCcw aria-hidden className="size-3" />
              <span>Reset to Platform Default</span>
            </Button>
          )}
        </div>

        {/* Current Active Specs Display */}
        <div className="grid gap-3 sm:grid-cols-3 text-xs">
          <div className="rounded bg-surface-subtle p-3 border border-line/60">
            <p className="text-subtle font-medium flex items-center gap-1.5">
              <KeyRound aria-hidden className="size-3.5 text-brand-700 dark:text-brand-900" />
              <span>Configured API Key</span>
            </p>
            <p className="mt-1 font-mono text-[13px] font-semibold text-ink">
              {currentConfig.isCustom ? currentConfig.maskedKey : 'Platform Managed Key'}
            </p>
            <p className="mt-0.5 text-[11px] text-subtle">
              {currentConfig.isCustom ? 'Stored client-side in local vault' : 'Default fallback enabled'}
            </p>
          </div>

          <div className="rounded bg-surface-subtle p-3 border border-line/60">
            <p className="text-subtle font-medium flex items-center gap-1.5">
              <Cpu aria-hidden className="size-3.5 text-brand-700 dark:text-brand-900" />
              <span>Active Reasoning Model</span>
            </p>
            <p className="mt-1 font-display text-[13px] font-semibold text-ink">
              {activeModelSpec.name}
            </p>
            <p className="mt-0.5 font-mono text-[11px] text-subtle truncate">
              {activeModelSpec.id}
            </p>
          </div>

          <div className="rounded bg-surface-subtle p-3 border border-line/60">
            <p className="text-subtle font-medium flex items-center gap-1.5">
              <Award aria-hidden className="size-3.5 text-gold" />
              <span>FinanceBench Factual Correctness</span>
            </p>
            <p className="mt-1 font-display text-[13px] font-semibold text-ink flex items-center gap-1.5">
              <span>{activeModelSpec.financeBenchScore}%</span>
              {activeModelSpec.id === TOP_FREE_MODEL_ID && (
                <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  (#1 Free Model)
                </span>
              )}
            </p>
            <p className="mt-0.5 text-[11px] text-subtle">
              Deterministic calculation shield active
            </p>
          </div>
        </div>

        {/* Permanent in-UI confirmation note */}
        {currentConfig.isCustom && (
          <div className="flex items-center gap-2 rounded bg-emerald-500/10 p-2.5 text-xs text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
            <ShieldCheck aria-hidden className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>
              <strong>Verified Active Configuration:</strong> Advisory chat queries are powered by {activeModelSpec.name} ({activeModelSpec.id}). All mathematical calculations remain sealed by the Tier 1 calculation shield.
            </span>
          </div>
        )}
      </Card>

      {/* API KEY & MODEL SELECTION FORM */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Card className="flex flex-col gap-5 border-line bg-surface">
          <div>
            <h3 className="font-display text-sm font-semibold text-ink flex items-center gap-2">
              <KeyRound aria-hidden className="size-4 text-brand-700 dark:text-brand-900" />
              <span>Enter Custom API Key</span>
            </h3>
            <p className="mt-0.5 text-xs text-subtle">
              Paste your OpenRouter, OpenAI, Anthropic, or Google API key. Provider is auto-detected.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="Paste API key e.g. sk-or-v1-..."
                value={keyInput}
                onChange={(e) => handleKeyChange(e.target.value)}
                className="font-mono text-xs"
              />
              <Button type="submit">
                {currentConfig.isCustom ? 'Update & Save' : 'Save & Connect'}
              </Button>
            </div>

            {/* Provider Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="text-subtle text-[11px]">Provider:</span>
              {(['openrouter', 'anthropic', 'openai', 'gemini'] as AiProvider[]).map((prov) => (
                <button
                  key={prov}
                  type="button"
                  onClick={() => setSelectedProvider(prov)}
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors border',
                    selectedProvider === prov
                      ? 'border-brand-600 bg-brand-600/10 text-brand-700 dark:text-brand-900 font-semibold'
                      : 'border-line text-subtle hover:text-ink hover:bg-surface-subtle',
                  )}
                >
                  {prov === 'openrouter' && 'OpenRouter (Universal)'}
                  {prov === 'anthropic' && 'Anthropic Claude'}
                  {prov === 'openai' && 'OpenAI'}
                  {prov === 'gemini' && 'Google Gemini'}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* BENCHMARKED MODELS LIST SORTED BY FINANCEBENCH */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h3 className="font-display text-sm font-semibold text-ink flex items-center gap-2">
                <Award aria-hidden className="size-4 text-gold" />
                <span>FinanceBench Benchmark Rankings</span>
              </h3>
              <p className="mt-0.5 text-xs text-subtle">
                Models sorted by factual correctness % on complex financial and accounting statements. Select a model to route queries through.
              </p>
            </div>

            {/* Spotlight on Nemotron Free */}
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
              <Award aria-hidden className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Featured: <strong>nvidia/nemotron-3-ultra-550b-a55b:free</strong> is the #1 Free Model</span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FINANCE_BENCH_MODELS.map((model) => (
              <ModelCard
                key={model.id}
                model={model}
                isSelected={selectedModelId === model.id}
                onSelect={(id) => setSelectedModelId(id)}
              />
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit">
              Apply Model Configuration
            </Button>
          </div>
        </div>
      </form>

      {/* MODEL AGNOSTIC DEVELOPER INTEGRATION ARCHITECTURE */}
      <div className="flex flex-col gap-2">
        <h3 className="font-display text-sm font-semibold text-ink">
          Model-Agnostic Developer Architecture
        </h3>
        <p className="text-xs text-subtle">
          Syntropy AI is designed to be completely model-agnostic across both TypeScript web applications and Python quant pipelines.
        </p>
        <CodeSnippets />
      </div>

      {/* TOAST NOTIFICATION OVERLAY */}
      {showToast && (
        <ToastNotification
          title="AI Gateway Connected"
          message={`Successfully configured custom AI key. Advisory queries will now evaluate using ${lastSavedModelName || activeModelSpec.name} with calculation shield guarantees.`}
          modelName={lastSavedModelName || activeModelSpec.name}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
}
