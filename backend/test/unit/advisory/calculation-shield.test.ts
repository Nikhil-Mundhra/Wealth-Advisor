import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { factNumbers, shieldText } from '../../../src/modules/advisory/domain/calculation-shield.ts';

const FALLBACK = 'deterministic text';
const facts = factNumbers('Runway: 3.2 months. Portfolio: €12345. Shifts equities from 60% to 40%.');

describe('calculation shield', () => {
  it('keeps text whose numbers restate the facts, including thousands separators', () => {
    const text = 'Your runway is 3.2 months on a €12,345 portfolio; equities move from 60% to 40%.';
    assert.equal(shieldText(text, FALLBACK, facts), text);
  });

  it('keeps a number rounded to the precision the text writes', () => {
    const text = 'About 3 months of runway.';
    assert.equal(shieldText(text, FALLBACK, facts), text);
  });

  it('reads a decimal comma as a decimal', () => {
    const text = 'Ihre Reserve beträgt 3,2 Monate.';
    assert.equal(shieldText(text, FALLBACK, facts), text);
  });

  it('falls back when the text introduces a number no engine produced', () => {
    assert.equal(shieldText('Expect a 7.5% annual return.', FALLBACK, facts), FALLBACK);
    assert.equal(shieldText('Your runway is 4 months.', FALLBACK, facts), FALLBACK);
  });

  it('falls back on a missing, empty or non-string candidate', () => {
    assert.equal(shieldText(undefined, FALLBACK, facts), FALLBACK);
    assert.equal(shieldText('  ', FALLBACK, facts), FALLBACK);
    assert.equal(shieldText(42, FALLBACK, facts), FALLBACK);
  });

  it('keeps text with no numbers', () => {
    assert.equal(shieldText('Consider a larger EUR buffer.', FALLBACK, facts), 'Consider a larger EUR buffer.');
  });
});
