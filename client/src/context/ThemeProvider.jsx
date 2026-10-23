import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { getTheme, setTheme as persistTheme } from '../utils/storage';

export const ThemeContext = createContext(null);

function resolve(theme) {
  if (theme === 'dark') return 'dark';
  if (theme === 'light') return 'light';
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

function apply(resolved) {
  const root = document.documentElement;
  if (resolved === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => getTheme());
  const [resolved, setResolved] = useState(() => resolve(getTheme()));

  const setTheme = useCallback((next) => {
    setThemeState(next);
    persistTheme(next);
    const r = resolve(next);
    setResolved(r);
    apply(r);
  }, []);

  const toggle = useCallback(() => {
    setTheme(resolved === 'dark' ? 'light' : 'dark');
  }, [resolved, setTheme]);

  useEffect(() => {
    const r = resolve(theme);
    setResolved(r);
    apply(r);
  }, [theme]);

  useEffect(() => {
    if (theme !== 'system' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const r = resolve('system');
      setResolved(r);
      apply(r);
    };
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, [theme]);

  const value = useMemo(
    () => ({ theme, resolved, setTheme, toggle }),
    [theme, resolved, setTheme, toggle]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}