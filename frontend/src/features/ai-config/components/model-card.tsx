import { Award, Check, Sparkles, Zap } from 'lucide-react';
import { cn } from '../../../lib/cn.ts';
import type { AiModelSpec } from '../types.ts';

interface ModelCardProps {
  model: AiModelSpec;
  isSelected: boolean;
  onSelect: (modelId: string) => void;
}

export function ModelCard({ model, isSelected, onSelect }: ModelCardProps) {
  const isNemotronFree = model.id === 'nvidia/nemotron-3-ultra-550b-a55b:free';

  return (
    <div
      onClick={() => onSelect(model.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(model.id);
        }
      }}
      className={cn(
        'group relative flex flex-col justify-between rounded-field border p-4 text-left transition-all cursor-pointer',
        isSelected
          ? 'border-brand-600 bg-brand-600/5 ring-1 ring-brand-600 dark:border-brand-500 dark:bg-brand-500/10'
          : 'border-line bg-surface hover:border-brand-600/40 hover:bg-surface-subtle',
      )}
    >
      <div>
        {/* Top Badges & FinanceBench Score */}
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {isNemotronFree && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                <Award aria-hidden className="size-3.5" />
                <span>#1 Best Free Model</span>
              </span>
            )}
            {model.isDefault && (
              <span className="flex items-center gap-1 rounded-full bg-brand-600/15 px-2.5 py-0.5 text-xs font-medium text-brand-700 dark:text-brand-900 border border-brand-600/20">
                <Sparkles aria-hidden className="size-3" />
                <span>Default Gateway</span>
              </span>
            )}
            {model.isFree && !isNemotronFree && (
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                Free Tier
              </span>
            )}
            <span className="rounded-full bg-surface-subtle px-2 py-0.5 text-[11px] font-mono text-subtle border border-line">
              {model.provider}
            </span>
          </div>

          {/* FinanceBench Factual Score Badge */}
          <div className="flex items-center gap-1.5 rounded-full bg-brand-600/10 px-2.5 py-0.5 text-xs font-semibold text-brand-700 dark:text-brand-900 border border-brand-600/20">
            <span className="text-[11px] font-normal text-subtle">FinanceBench:</span>
            <span>{model.financeBenchScore}%</span>
          </div>
        </div>

        {/* Model Title & ID */}
        <div className="mt-2.5 flex items-start justify-between gap-2">
          <div>
            <h4 className="font-display text-sm font-semibold text-ink group-hover:text-brand-700 dark:group-hover:text-brand-900 transition-colors">
              {model.name}
            </h4>
            <p className="font-mono text-xs text-subtle">{model.id}</p>
          </div>
          <div
            className={cn(
              'flex size-5 shrink-0 items-center justify-center rounded-full border transition-all mt-0.5',
              isSelected
                ? 'border-brand-600 bg-brand-600 text-white dark:border-brand-500 dark:bg-brand-500'
                : 'border-line bg-surface group-hover:border-subtle',
            )}
          >
            {isSelected && <Check aria-hidden className="size-3.5 stroke-[3]" />}
          </div>
        </div>

        {/* Description */}
        <p className="mt-2 text-xs leading-relaxed text-subtle">{model.description}</p>
      </div>

      {/* Footer Specs: Latency, Context, Pricing */}
      <div className="mt-4 pt-3 border-t border-line/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-subtle">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Zap aria-hidden className="size-3 text-gold" />
            <span>{model.latency}</span>
          </span>
          <span>Context: {model.contextWindow}</span>
        </div>
        <span className="font-medium text-ink">{model.pricing}</span>
      </div>
    </div>
  );
}
