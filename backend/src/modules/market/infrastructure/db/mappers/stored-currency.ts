import { type Currency, isCurrency } from '@wealth-advisor/rules';
import { MarketErrors } from '../../../domain/errors/market-errors.ts';

// A stored code outside CURRENCIES is corruption (500), never silently cast.
export function storedCurrency(code: string): Currency {
  if (!isCurrency(code)) throw MarketErrors.invariantViolated(`stored currency ${code} is unknown`);
  return code;
}
