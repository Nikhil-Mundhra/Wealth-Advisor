import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Database, Key, RotateCcw, Server, ShieldCheck, X } from 'lucide-react';
import type { PlatformKeysStatusDto } from '@wealth-advisor/contracts';
import { Button } from '../../../components/ui/button.tsx';
import { cardClassName } from '../../../components/ui/card.tsx';
import { updatePlatformKeys } from '../api/admin-api.ts';
import { cn } from '../../../lib/cn.ts';

interface PlatformKeysCardProps {
  platformKeys?: PlatformKeysStatusDto;
}

interface KeyConfigState {
  gemini: string;
  openai: string;
  anthropic: string;
  openrouter: string;
  marketstack: string;
}

export function PlatformKeysCard({ platformKeys }: PlatformKeysCardProps) {
  const queryClient = useQueryClient();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draftKeys, setDraftKeys] = useState<KeyConfigState>({
    gemini: '',
    openai: '',
    anthropic: '',
    openrouter: '',
    marketstack: '',
  });
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: updatePlatformKeys,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'models'] });
      setEditingKey(null);
      setDraftKeys({ gemini: '', openai: '', anthropic: '', openrouter: '', marketstack: '' });
      setFeedbackMessage('Platform keys updated successfully');
      setTimeout(() => setFeedbackMessage(null), 4000);
    },
  });

  const providers = [
    {
      id: 'gemini',
      label: 'Google Gemini',
      description: 'Powers default low-latency LLM advisory simulations and narrative explanations',
      status: platformKeys?.gemini,
      envKeyName: 'GEMINI_API_KEY',
    },
    {
      id: 'openai',
      label: 'OpenAI (GPT-4o)',
      description: 'Powers structured advisory chat completions and cross-border calculations',
      status: platformKeys?.openai,
      envKeyName: 'OPENAI_API_KEY',
    },
    {
      id: 'anthropic',
      label: 'Anthropic Claude',
      description: 'High-reasoning fiduciary scenario modeling and synthesis',
      status: platformKeys?.anthropic,
      envKeyName: 'ANTHROPIC_API_KEY',
    },
    {
      id: 'openrouter',
      label: 'OpenRouter (Universal)',
      description: 'Unified gateway for benchmarked frontier & open-weight financial models (Nemotron, Claude, GPT-4o, Llama 3)',
      status: platformKeys?.openrouter,
      envKeyName: 'OPENROUTER_API_KEY',
    },
    {
      id: 'marketstack',
      label: 'Marketstack EOD',
      description: 'Metered global equities, sukuk, and ETF price data feed',
      status: platformKeys?.marketstack,
      envKeyName: 'MARKETSTACK_ACCESS_KEY',
    },
  ] as const;

  const handleSaveKey = (id: 'gemini' | 'openai' | 'anthropic' | 'openrouter' | 'marketstack') => {
    const value = draftKeys[id].trim();
    const payload: Record<string, string | null> = {};
    if (id === 'gemini') payload.geminiApiKey = value || null;
    if (id === 'openai') payload.openaiApiKey = value || null;
    if (id === 'anthropic') payload.anthropicApiKey = value || null;
    if (id === 'openrouter') payload.openrouterApiKey = value || null;
    if (id === 'marketstack') payload.marketstackAccessKey = value || null;
    mutation.mutate(payload);
  };

  const handleRevertToEnv = (id: 'gemini' | 'openai' | 'anthropic' | 'openrouter' | 'marketstack') => {
    const payload: Record<string, string | null> = {};
    if (id === 'gemini') payload.geminiApiKey = null;
    if (id === 'openai') payload.openaiApiKey = null;
    if (id === 'anthropic') payload.anthropicApiKey = null;
    if (id === 'openrouter') payload.openrouterApiKey = null;
    if (id === 'marketstack') payload.marketstackAccessKey = null;
    mutation.mutate(payload);
  };

  return (
    <div className={cn(cardClassName, 'flex flex-col gap-4')}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-line pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Key aria-hidden className="size-4 text-brand-600 dark:text-brand-700" />
            <h3 className="font-semibold text-ink">Platform Managed Keys</h3>
          </div>
          <p className="mt-0.5 text-xs text-subtle">
            Configure platform provider credentials in the database with automatic fallback to system environment variables.
          </p>
        </div>
        {feedbackMessage && (
          <div className="flex items-center gap-1.5 rounded-field bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <Check aria-hidden className="size-3.5" />
            <span>{feedbackMessage}</span>
          </div>
        )}
      </div>

      <ul className="flex flex-col divide-y divide-line">
        {providers.map(({ id, label, description, status, envKeyName }) => {
          const isEditing = editingKey === id;
          const isDbSource = status?.source === 'db';
          const isEnvSource = status?.source === 'env';

          return (
            <li key={id} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-ink text-sm">{label}</span>
                    {isDbSource && (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                        <Database aria-hidden className="size-3" />
                        Database Active
                      </span>
                    )}
                    {isEnvSource && (
                      <span className="inline-flex items-center gap-1 rounded bg-brand-500/10 px-2 py-0.5 text-[11px] font-medium text-brand-700 dark:text-brand-400">
                        <Server aria-hidden className="size-3" />
                        ENV Fallback Active
                      </span>
                    )}
                    {status?.source === 'none' && (
                      <span className="inline-flex items-center gap-1 rounded bg-surface-subtle px-2 py-0.5 text-[11px] font-medium text-subtle border border-line">
                        Unconfigured
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-subtle">{description}</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex flex-col sm:items-end">
                    <span className="font-mono text-xs text-ink tabular-nums">
                      {status?.maskedKey ?? 'No key active'}
                    </span>
                    <span className="text-[10px] text-subtle font-mono">
                      Fallback: {envKeyName}
                    </span>
                  </div>

                  {!isEditing && (
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-8 px-2.5 text-xs"
                        onClick={() => {
                          setEditingKey(id);
                          setDraftKeys((prev) => ({ ...prev, [id]: '' }));
                        }}
                      >
                        {isDbSource ? 'Change' : 'Override'}
                      </Button>
                      {isDbSource && (
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-8 px-2 text-xs"
                          disabled={mutation.isPending}
                          title="Revert to system environment variable fallback"
                          onClick={() => handleRevertToEnv(id)}
                        >
                          <RotateCcw aria-hidden className="size-3.5 text-subtle" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 rounded-field bg-surface-subtle p-2.5 border border-line">
                  <div className="relative flex-1">
                    <input
                      type="password"
                      placeholder={`Enter new ${label} API key...`}
                      value={draftKeys[id]}
                      onChange={(e) => setDraftKeys((prev) => ({ ...prev, [id]: e.target.value }))}
                      className="w-full rounded-field border border-line bg-surface px-3 py-1.5 text-xs text-ink placeholder:text-subtle/50 focus:border-brand-600 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <Button
                      type="button"
                      variant="primary"
                      className="h-8 px-2.5 text-xs"
                      disabled={mutation.isPending || !draftKeys[id].trim()}
                      onClick={() => handleSaveKey(id)}
                    >
                      Save Key
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-8 px-2 text-xs"
                      disabled={mutation.isPending}
                      onClick={() => setEditingKey(null)}
                    >
                      <X aria-hidden className="size-3.5" />
                      <span className="sr-only">Cancel</span>
                    </Button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-1 flex items-start gap-2 rounded-field bg-surface-subtle p-3 text-xs text-subtle border border-line/60">
        <ShieldCheck aria-hidden className="size-4 shrink-0 text-brand-600 dark:text-brand-700 mt-0.5" />
        <p>
          Keys configured in the database take strict precedence over system environment variables. Values are encrypted at rest, masked in transit, and never exposed in full over the administrative API.
        </p>
      </div>
    </div>
  );
}
