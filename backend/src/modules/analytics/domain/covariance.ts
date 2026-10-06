import { TRADING_DAYS_PER_YEAR } from '@wealth-advisor/rules';
import { invariant } from '#core/domain/invariant.ts';
import { AnalyticsErrors } from './errors/analytics-errors.ts';

// Annualized sample covariance (n − 1 denominator) of aligned daily return series; rows and columns follow the
// order of `returns`. Each pair is computed once and mirrored, so the matrix is exactly symmetric and its diagonal
// is each series' variance. Daily variance scales linearly with time under independent returns, hence × 252.
export function annualizedCovariance(returns: readonly (readonly number[])[]): number[][] {
  const observations = returns[0]?.length ?? 0;
  invariant(
    returns.every((series) => series.length === observations),
    () => AnalyticsErrors.invariantViolated('return series differ in length'),
  );
  invariant(observations >= 2, () => AnalyticsErrors.invariantViolated('a sample covariance needs at least two returns'));
  const means = returns.map((series) => series.reduce((sum, value) => sum + value, 0) / observations);
  const matrix = returns.map(() => new Array<number>(returns.length).fill(0));
  for (let i = 0; i < returns.length; i += 1) {
    for (let j = i; j < returns.length; j += 1) {
      let sum = 0;
      for (let t = 0; t < observations; t += 1) sum += (returns[i][t] - means[i]) * (returns[j][t] - means[j]);
      const value = (sum / (observations - 1)) * TRADING_DAYS_PER_YEAR;
      matrix[i][j] = value;
      matrix[j][i] = value;
    }
  }
  return matrix;
}
