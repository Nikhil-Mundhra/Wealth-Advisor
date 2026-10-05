import { describe, expect, it } from 'vitest';
import { LOCALES } from '@wealth-advisor/rules';
import { STRINGS } from './dictionaries.ts';

describe('dictionaries', () => {
  it('gives every locale exactly the English keys, so no screen renders a blank label', () => {
    const keys = Object.keys(STRINGS.en).sort();
    for (const locale of LOCALES) {
      expect(Object.keys(STRINGS[locale]).sort()).toEqual(keys);
    }
  });
});
