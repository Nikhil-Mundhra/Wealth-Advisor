import { useState } from 'react';
import { Check, Copy, Terminal, FileCode2 } from 'lucide-react';
import { cn } from '../../../lib/cn.ts';

const TYPESCRIPT_SNIPPET = `// Stack 1: Full-Stack Web / Next.js / Node
// Prerequisites:
// npm install ai @ai-sdk/openai @ai-sdk/anthropic @ai-sdk/google zod

import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';

// Configure model-agnostic provider (e.g. OpenRouter with NVIDIA Nemotron 3 Ultra)
const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || userApiKey,
});

// Deterministic schema validation with Zod
const AdvisoryPlanSchema = z.object({
  fiduciaryAssessment: z.string(),
  rebalanceActions: z.array(z.object({
    asset: z.string(),
    deltaPercent: z.number(),
    rationale: z.string(),
  })),
  driftExceeded: z.boolean(),
});

export async function runAdvisoryPipeline(prompt: string) {
  const { object } = await generateObject({
    model: openrouter('nvidia/nemotron-3-ultra-550b-a55b:free'),
    schema: AdvisoryPlanSchema,
    prompt,
    temperature: 0.1,
  });

  return object; // Guaranteed type-safe & deterministic output
}`;

const PYTHON_SNIPPET = `# Stack 2: Python / Microservices / Quantitative Pipelines
# Prerequisites:
# brew install uv
# uv add litellm pydantic

import os
from litellm import completion
from pydantic import BaseModel, Field

# Deterministic schema validation with Pydantic
class RebalanceAction(BaseModel):
    asset: str = Field(description="Ticker or asset class name")
    delta_percent: float = Field(description="Target allocation shift")
    rationale: str

class AdvisoryPlan(BaseModel):
    fiduciary_assessment: str
    rebalance_actions: list[RebalanceAction]
    drift_exceeded: bool

def run_advisory_pipeline(prompt: str, user_api_key: str | None = None) -> AdvisoryPlan:
    # Model-agnostic routing via LiteLLM to OpenRouter / Nemotron, Gemini, or Claude
    response = completion(
        model="openrouter/nvidia/nemotron-3-ultra-550b-a55b:free",
        messages=[{"role": "user", "content": prompt}],
        api_key=user_api_key or os.getenv("OPENROUTER_API_KEY"),
        response_format=AdvisoryPlan,
        temperature=0.1,
    )

    return AdvisoryPlan.model_validate_json(response.choices[0].message.content)`;

export function CodeSnippets() {
  const [activeTab, setActiveTab] = useState<'ts' | 'python'>('ts');
  const [copied, setCopied] = useState(false);

  const snippet = activeTab === 'ts' ? TYPESCRIPT_SNIPPET : PYTHON_SNIPPET;

  const handleCopy = () => {
    void navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-card border border-line bg-surface overflow-hidden">
      {/* Header Tabs */}
      <div className="flex flex-wrap items-center justify-between border-b border-line bg-surface-subtle px-4 py-2.5">
        <div className="flex items-center gap-2">
          <FileCode2 aria-hidden className="size-4 text-brand-700 dark:text-brand-900" />
          <span className="text-xs font-semibold text-ink">
            Model-Agnostic Developer Integration
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('ts')}
            className={cn(
              'rounded px-2.5 py-1 text-xs font-medium transition-colors',
              activeTab === 'ts'
                ? 'bg-brand-600 text-white dark:bg-brand-500'
                : 'text-subtle hover:bg-surface hover:text-ink',
            )}
          >
            TypeScript (AI SDK + Zod)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('python')}
            className={cn(
              'rounded px-2.5 py-1 text-xs font-medium transition-colors',
              activeTab === 'python'
                ? 'bg-brand-600 text-white dark:bg-brand-500'
                : 'text-subtle hover:bg-surface hover:text-ink',
            )}
          >
            Python (LiteLLM + Pydantic)
          </button>
        </div>
      </div>

      {/* Package Install Banner */}
      <div className="flex items-center justify-between border-b border-line bg-surface px-4 py-2 text-xs font-mono text-subtle">
        <div className="flex items-center gap-2">
          <Terminal aria-hidden className="size-3.5 text-subtle" />
          <span>
            {activeTab === 'ts'
              ? 'npm install ai @ai-sdk/openai @ai-sdk/anthropic @ai-sdk/google zod'
              : 'brew install uv && uv add litellm pydantic'}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 rounded bg-surface-subtle px-2 py-0.5 text-xs text-subtle hover:text-ink hover:bg-surface border border-line transition-colors"
        >
          {copied ? (
            <>
              <Check aria-hidden className="size-3 text-emerald-600 dark:text-emerald-400" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy aria-hidden className="size-3" />
              <span>Copy snippet</span>
            </>
          )}
        </button>
      </div>

      {/* Code Block */}
      <pre className="overflow-x-auto p-4 text-[12px] font-mono leading-relaxed text-ink/90 bg-surface-subtle/50">
        <code>{snippet}</code>
      </pre>
    </div>
  );
}
