import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { toPricePoints } from '../../../src/modules/analytics/application/snapshot-inputs.ts';
import { Money } from '../../../src/modules/market/domain/money.vo.ts';
import { Price } from '../../../src/modules/market/domain/price.vo.ts';

const price = (symbol: string, date: string, close: number, adjClose: number | null) =>
  Price.of({ symbol, date, close: Money.of(close, 'USD'), adjClose: adjClose === null ? null : Money.of(adjClose, 'USD'), source: 'test' });

describe('toPricePoints', () => {
  it('uses the adjusted close for a symbol only when every close has one', () => {
    const points = toPricePoints([
      price('VT', '2025-01-02', 100, 90),
      price('VT', '2025-01-03', 101, 91),
      price('VOO', '2025-01-02', 200, 180),
      price('VOO', '2025-01-03', 202, null),
    ]);
    assert.deepEqual(
      points.map((point) => `${point.symbol} ${point.date} ${point.value}`),
      ['VT 2025-01-02 90', 'VT 2025-01-03 91', 'VOO 2025-01-02 200', 'VOO 2025-01-03 202'],
    );
  });
});
