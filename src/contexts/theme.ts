import { createContext, useContext } from 'react';

export type ThemeContextValue = {
  darkMode: boolean;
  setDarkMode: (enabled: boolean) => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used inside ThemeProvider.');
  }
  return ctx;
}
