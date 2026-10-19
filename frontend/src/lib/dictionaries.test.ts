import { describe, expect, it } from 'vitest';
import { LOCALES } from '@wealth-advisor/rules';
import { STRINGS, type StringKey } from './dictionaries.ts';

const EN_KEYS = Object.keys(STRINGS.en) as StringKey[];

describe('dictionaries', () => {
  it('gives every locale the same keys as English', () => {
    for (const locale of LOCALES) {
      expect(Object.keys(STRINGS[locale]).sort(), locale).toEqual([...EN_KEYS].sort());
    }
  });

  it('keeps every value non-empty', () => {
    for (const locale of LOCALES) {
      for (const key of EN_KEYS) {
        expect(STRINGS[locale][key].trim(), `${locale} ${key}`).not.toBe('');
      }
    }
  });

  it('renders Chinese copy in its own script', () => {
    const cjk = /[一-鿿]/;
    // Brand names and numeric separators stay untranslated in every locale.
    const untranslated = new Set<StringKey>(['app.name', 'profiling.of']);
    for (const locale of ['zh-CN', 'zh-HK'] as const) {
      for (const key of EN_KEYS) {
        if (untranslated.has(key)) continue;
        expect(cjk.test(STRINGS[locale][key]), `${locale} ${key}`).toBe(true);
      }
    }
  });
});
