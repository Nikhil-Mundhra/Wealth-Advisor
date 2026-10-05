import { useSyncExternalStore } from 'react';
import { Moon, Sun } from 'lucide-react';
import { getTheme, setTheme, subscribeToTheme } from '../../lib/theme-store.ts';
import { useStrings } from '../../lib/dictionaries.ts';
import { IconButton } from './icon-button.tsx';

// Header control: flips the .dark class on <html>; the choice persists in localStorage.
export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeToTheme, getTheme);
  const strings = useStrings();
  const dark = theme === 'dark';
  return (
    <IconButton
      label={strings[dark ? 'theme.light' : 'theme.dark']}
      variant="ghost"
      onClick={(event) => setTheme(dark ? 'light' : 'dark', { x: event.clientX, y: event.clientY })}
    >
      {dark ? <Sun aria-hidden /> : <Moon aria-hidden />}
    </IconButton>
  );
}
