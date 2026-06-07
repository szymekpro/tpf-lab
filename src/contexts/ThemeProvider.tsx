import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ThemeContext } from './theme';

const STORAGE_KEY = 'diabetcare_theme';

function loadDarkMode(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'dark';
  } catch {
    return false;
  }
}

type Props = {
  children: ReactNode;
};

export function ThemeProvider({ children }: Props) {
  const [darkMode, setDarkMode] = useState(loadDarkMode);

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light';
    try {
      localStorage.setItem(STORAGE_KEY, darkMode ? 'dark' : 'light');
    } catch {
      /* ignore */
    }
  }, [darkMode]);

  const value = useMemo(() => ({ darkMode, setDarkMode }), [darkMode]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
