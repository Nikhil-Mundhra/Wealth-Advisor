import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { setLocale } from '../../lib/locale-store.ts';
import { LanguageSelect } from './language-select.tsx';

describe('LanguageSelect', () => {
  it('lists every supported locale and persists the choice', async () => {
    setLocale('en');
    render(<LanguageSelect />);

    const select = screen.getByRole('combobox', { name: 'Language' });
    expect(select).toHaveValue('en');
    for (const name of ['English', '简体中文', '繁體中文', 'Deutsch']) {
      expect(screen.getByRole('option', { name })).toBeInTheDocument();
    }

    await userEvent.selectOptions(select, 'de');
    expect(window.localStorage.getItem('dewa-locale')).toBe('de');
    expect(document.documentElement.lang).toBe('de');
  });
});
