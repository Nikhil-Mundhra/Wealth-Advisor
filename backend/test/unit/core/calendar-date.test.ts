import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { addDays, isIsoDate } from '#core/time/calendar-date.ts';

describe('calendar dates', () => {
  it('isIsoDate accepts real days and refuses malformed, impossible and rolled-over ones without throwing', () => {
    assert.equal(isIsoDate('2024-02-29'), true);
    for (const value of ['2025-13-01', '2025-02-30', '2025-00-10', '2025-1-01', 'today', '']) assert.equal(isIsoDate(value), false, value);
  });

  it('addDays crosses month, year and leap-day boundaries', () => {
    assert.equal(addDays('2025-01-07', -365), '2024-01-08');
    assert.equal(addDays('2024-02-28', 1), '2024-02-29');
    assert.equal(addDays('2024-12-31', 1), '2025-01-01');
  });
});
