import { MarketErrors } from './errors/market-errors.ts';

// Exact rational arithmetic for money. Provider prices and rates are decimals that binary floats cannot hold
// (1.1 is 1.100000000000000088…), so a float product can land on the wrong side of a .5 and break round-half-even.
export interface Ratio {
  readonly num: bigint;
  readonly den: bigint; // always > 0
}

const DECIMAL = /^(-?)(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/;

// The exact decimal the number prints as (JS prints the shortest string that reads back to the same float).
export function ratioOf(value: number): Ratio {
  const match = Number.isFinite(value) ? DECIMAL.exec(String(value)) : null;
  if (!match) throw MarketErrors.invariantViolated(`not a finite decimal: ${value}`);
  const [, sign, whole, fraction = '', exponent = '0'] = match;
  const digits = BigInt(`${sign}${whole}${fraction}`);
  const scale = Number(exponent) - fraction.length;
  return scale >= 0 ? { num: digits * 10n ** BigInt(scale), den: 1n } : { num: digits, den: 10n ** BigInt(-scale) };
}

export function multiply(a: Ratio, b: Ratio): Ratio {
  return { num: a.num * b.num, den: a.den * b.den };
}

export function divide(a: Ratio, b: Ratio): Ratio {
  if (b.num === 0n) throw MarketErrors.invariantViolated('division by zero');
  const sign = b.num < 0n ? -1n : 1n;
  return { num: a.num * b.den * sign, den: a.den * b.num * sign };
}

export function scaleByPowerOfTen(a: Ratio, exponent: number): Ratio {
  return exponent >= 0
    ? { num: a.num * 10n ** BigInt(exponent), den: a.den }
    : { num: a.num, den: a.den * 10n ** BigInt(-exponent) };
}

// Round half to even (banker's rounding): ties go to the even neighbour, so repeated conversions carry no upward bias.
export function roundHalfEven(a: Ratio): bigint {
  const negative = a.num < 0n;
  const magnitude = negative ? -a.num : a.num;
  let quotient = magnitude / a.den;
  const twiceRemainder = (magnitude % a.den) * 2n;
  if (twiceRemainder > a.den || (twiceRemainder === a.den && quotient % 2n === 1n)) quotient += 1n;
  return negative ? -quotient : quotient;
}

export function toNumber(a: Ratio): number {
  return Number(a.num) / Number(a.den);
}
