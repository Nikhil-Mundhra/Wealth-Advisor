export interface PiiRedactionResult {
  readonly redactedText: string;
  readonly redactionCount: number;
  readonly redactedTypes: readonly string[];
}

export interface PromptInjectionCheckResult {
  readonly detected: boolean;
  readonly matchedPatterns: readonly string[];
}

export interface SanitizedInputResult {
  readonly sanitizedText: string;
  readonly piiRedacted: boolean;
  readonly redactionCount: number;
  readonly redactedTypes: readonly string[];
  readonly injectionDetected: boolean;
  readonly matchedPatterns: readonly string[];
}

const PII_PATTERNS: ReadonlyArray<{ type: string; regex: RegExp; replacement: string }> = [
  {
    type: 'EMAIL',
    regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    replacement: '[REDACTED_EMAIL]',
  },
  {
    type: 'IBAN',
    regex: /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/g,
    replacement: '[REDACTED_IBAN]',
  },
  {
    type: 'CARD_OR_ACCOUNT',
    regex: /\b(?:\d{4}[\s-]?){3}\d{4}\b/g,
    replacement: '[REDACTED_ACCOUNT]',
  },
  {
    type: 'PHONE',
    regex: /(?:\+\d{1,3}[\s.-]?\d{2,4}[\s.-]?\d{3,4}[\s.-]?\d{3,4}\b|\b\d{3}[\s.-]\d{3}[\s.-]\d{4}\b)/g,
    replacement: '[REDACTED_PHONE]',
  },
];

const INJECTION_PATTERNS: ReadonlyArray<{ name: string; regex: RegExp }> = [
  {
    name: 'IGNORE_INSTRUCTIONS',
    regex: /\bignore\s+(?:all\s+|any\s+|every\s+)?(?:previous|prior|above|system)\s+(?:instructions?|prompts?|rules?)\b/gi,
  },
  {
    name: 'SYSTEM_OVERRIDE',
    regex: /\b(?:system\s+override|developer\s+mode|jailbreak)\b/gi,
  },
  {
    name: 'BYPASS_PASSKEY_OR_TIER3',
    regex: /\b(?:execute_sandbox_trade|bypass\s+(?:passkey|guardrail|tier)|tier_3_execute)\b/gi,
  },
  {
    name: 'PROMPT_TAG_SPOOFING',
    regex: /<\/?(?:system|assistant|inst|tool_call)>|<<\/?sys>>/gi,
  },
];

/**
 * Redacts emails, IBANs, card/account numbers, and phone numbers before untrusted text
 * is sent to an LLM provider or written to structured application logs.
 */
export function redactPii(input: string): PiiRedactionResult {
  let redactedText = input;
  let redactionCount = 0;
  const types = new Set<string>();

  for (const { type, regex, replacement } of PII_PATTERNS) {
    regex.lastIndex = 0;
    const next = redactedText.replace(regex, () => {
      redactionCount += 1;
      types.add(type);
      return replacement;
    });
    redactedText = next;
  }

  return {
    redactedText,
    redactionCount,
    redactedTypes: [...types],
  };
}

export function detectPromptInjection(input: string): PromptInjectionCheckResult {
  const matchedPatterns: string[] = [];
  for (const { name, regex } of INJECTION_PATTERNS) {
    regex.lastIndex = 0;
    if (regex.test(input)) {
      matchedPatterns.push(name);
    }
  }
  return {
    detected: matchedPatterns.length > 0,
    matchedPatterns,
  };
}

export function sanitizeUntrustedInput(input: string): SanitizedInputResult {
  const pii = redactPii(input);
  let sanitizedText = pii.redactedText;
  const matchedPatterns: string[] = [];

  for (const { name, regex } of INJECTION_PATTERNS) {
    regex.lastIndex = 0;
    if (regex.test(sanitizedText)) {
      matchedPatterns.push(name);
      regex.lastIndex = 0;
      sanitizedText = sanitizedText.replace(regex, '[FILTERED_INSTRUCTION]');
    }
  }

  return {
    sanitizedText,
    piiRedacted: pii.redactionCount > 0,
    redactionCount: pii.redactionCount,
    redactedTypes: pii.redactedTypes,
    injectionDetected: matchedPatterns.length > 0,
    matchedPatterns,
  };
}
