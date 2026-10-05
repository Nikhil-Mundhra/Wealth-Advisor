export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'dewa-theme';
const listeners = new Set<() => void>();

const notify = (): void => listeners.forEach((listener) => listener());

function systemTheme(): Theme {
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

function storedTheme(): Theme | null {
  if (typeof window === 'undefined') return null;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'light' || stored === 'dark' ? stored : null;
}

function applyTheme(theme: Theme): void {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }
}

// The stored choice wins; otherwise the OS preference, so first paint matches the user's system.
let theme: Theme = storedTheme() ?? systemTheme();
applyTheme(theme);

export function getTheme(): Theme {
  return theme;
}

export function setTheme(next: Theme, origin?: { x: number; y: number }): void {
  theme = next;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, next);
  }
  // Circular wipe from the toggle; plain swap without View Transitions or with reduced motion.
  const reduce = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const transition = (document as Document & { startViewTransition?: (fn: () => void) => void }).startViewTransition;
  if (!reduce && origin && typeof document !== 'undefined' && transition) {
    document.documentElement.style.setProperty('--theme-x', `${origin.x}px`);
    document.documentElement.style.setProperty('--theme-y', `${origin.y}px`);
    transition.call(document, () => applyTheme(next));
  } else {
    applyTheme(next);
  }
  notify();
}

export function subscribeToTheme(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
