// Model text may restate numbers the engines produced, never introduce its own: a candidate whose every number matches
// a fact (exactly, or rounded to the precision the candidate writes) is kept; any other candidate yields the fallback.
// Numbers spelled out in words are not detected.

const NUMBER = /\d+(?:[.,]\d+)*/g;

interface Reading {
  readonly value: number;
  readonly decimals: number;
}

// "12,345" and "12.345" read as thousands or as decimals, "3,2" and "3.2" as decimals; every plausible reading is kept.
function readings(token: string): Reading[] {
  const groups = token.split(/[.,]/);
  const result: Reading[] = [];
  const [head = '', ...rest] = groups;
  if (rest.every((group) => group.length === 3)) result.push({ value: Number(groups.join('')), decimals: 0 });
  if (rest.length > 0) {
    const fraction = rest[rest.length - 1] ?? '';
    const whole = [head, ...rest.slice(0, -1)].join('');
    result.push({ value: Number(`${whole}.${fraction}`), decimals: fraction.length });
  }
  if (rest.length === 0) result.push({ value: Number(head), decimals: 0 });
  return result;
}

function numbersIn(text: string): Reading[][] {
  return [...text.matchAll(NUMBER)].map((match) => readings(match[0]));
}

const roundTo = (value: number, decimals: number): number => Number(value.toFixed(decimals));

function grounded(candidate: Reading[], facts: readonly number[]): boolean {
  return candidate.some(({ value, decimals }) => facts.some((fact) => roundTo(fact, decimals) === value));
}

export function factNumbers(...texts: readonly string[]): number[] {
  return texts.flatMap((text) => numbersIn(text).flat().map((reading) => reading.value));
}

export function shieldText(candidate: unknown, fallback: string, facts: readonly number[]): string {
  if (typeof candidate !== 'string' || candidate.trim() === '') return fallback;
  return numbersIn(candidate).every((reading) => grounded(reading, facts)) ? candidate : fallback;
}
