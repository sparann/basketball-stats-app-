import { useCallback, useEffect, useState } from 'react';

const KEY = 'theme';
const THEME_COLOR = { dark: '#1b1714', light: '#faf7f2' };

const readTheme = () => {
  try {
    return localStorage.getItem(KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
};

const applyTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', THEME_COLOR[theme]);
};

/** Dark is the default. index.html applies the saved choice before first paint; this keeps it in sync. */
export const useTheme = () => {
  const [theme, setTheme] = useState(readTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(KEY, next);
      } catch {
        // storage unavailable; the choice just doesn't persist
      }
      return next;
    });
  }, []);

  return { theme, toggle };
};
