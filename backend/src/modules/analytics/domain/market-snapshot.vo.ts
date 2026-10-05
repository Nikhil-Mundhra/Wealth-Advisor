import { invariant } from '#core/domain/invariant.ts';
import { ValueObject } from '#core/domain/value-object.ts';
import { isIsoDate } from '#core/time/calendar-date.ts';
import { AnalyticsErrors } from './errors/analytics-errors.ts';

export interface SnapshotWindow {
  readonly from: string; // first aligned price date that fed the numbers
  readonly to: string; // last aligned price date
  readonly observations: number; // daily returns per symbol
}

// A derived value: annualized means, volatilities and covariance of the tracked symbols' daily log returns,
// keyed by the data date (asOf) of the refresh that produced it. window and computedAt are its provenance.
// Vector entries and matrix rows/columns follow the order of `symbols`.
export interface MarketSnapshotValue {
  readonly asOf: string;
  readonly symbols: readonly string[];
  readonly means: readonly number[];
  readonly volatilities: readonly number[];
  readonly covariance: readonly (readonly number[])[];
  readonly window: SnapshotWindow;
  readonly computedAt: Date;
}

// Stored doubles round-trip exactly, so this only absorbs sqrt/square rounding in the volatility check.
const RELATIVE_TOLERANCE = 1e-9;

const broken = (detail: string) => () => AnalyticsErrors.invariantViolated(`market snapshot ${detail}`);

export class MarketSnapshot extends ValueObject<MarketSnapshotValue> {
  // Copies every array and freezes it, so a caller keeping its own reference cannot change the snapshot.
  static of(value: MarketSnapshotValue): MarketSnapshot {
    return ValueObject.fromStored(
      {
        ...value,
        symbols: Object.freeze([...value.symbols]),
        means: Object.freeze([...value.means]),
        volatilities: Object.freeze([...value.volatilities]),
        covariance: Object.freeze(value.covariance.map((row) => Object.freeze([...row]))),
        window: Object.freeze({ ...value.window }),
      },
      (v) => new MarketSnapshot(v),
    );
  }

  get asOf(): string {
    return this.value.asOf;
  }

  get symbols(): readonly string[] {
    return this.value.symbols;
  }

  get means(): readonly number[] {
    return this.value.means;
  }

  get volatilities(): readonly number[] {
    return this.value.volatilities;
  }

  get covariance(): readonly (readonly number[])[] {
    return this.value.covariance;
  }

  get window(): SnapshotWindow {
    return this.value.window;
  }

  get computedAt(): Date {
    return this.value.computedAt;
  }

  protected override postInit(): void {
    const { asOf, symbols, means, volatilities, covariance, window, computedAt } = this.value;
    const n = symbols.length;
    invariant(isIsoDate(asOf), broken(`asOf "${asOf}" is not YYYY-MM-DD`));
    invariant(n > 0 && new Set(symbols).size === n, broken('needs at least one symbol, each once'));
    invariant(means.length === n && volatilities.length === n, broken('vectors do not match the symbols in length'));
    invariant(covariance.length === n && covariance.every((row) => row.length === n), broken('covariance is not square over the symbols'));
    invariant([...means, ...volatilities, ...covariance.flat()].every(Number.isFinite), broken('holds a non-finite number'));
    invariant(isSymmetric(covariance), broken('covariance is not symmetric'));
    invariant(
      volatilities.every((volatility, i) => volatility >= 0 && near(volatility * volatility, covariance[i][i])),
      broken('volatilities are not the square roots of the covariance diagonal'),
    );
    invariant(isIsoDate(window.from) && isIsoDate(window.to), broken('window dates are not YYYY-MM-DD'));
    invariant(window.from <= window.to && window.to <= asOf, broken('window does not end on or before asOf'));
    invariant(Number.isInteger(window.observations) && window.observations >= 2, broken('needs at least two observations'));
    invariant(!Number.isNaN(computedAt.getTime()), broken('computedAt is not a valid instant'));
  }
}

function isSymmetric(matrix: readonly (readonly number[])[]): boolean {
  return matrix.every((row, i) => row.every((value, j) => near(value, matrix[j][i])));
}

function near(a: number, b: number): boolean {
  return Math.abs(a - b) <= RELATIVE_TOLERANCE * Math.max(1, Math.abs(a), Math.abs(b));
}
