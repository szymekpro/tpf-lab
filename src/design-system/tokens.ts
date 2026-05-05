/**
 * Design tokens – jedyne źródło prawdy dla wartości używanych w TS
 * (np. inline style, kolory na canvas/SVG). Klasy CSS używają zmiennych
 * z `index.css`, więc tu trzymamy paralele tylko dla scenariuszy,
 * w których styl wyrażamy w JS.
 */
export const colors = {
  primary: {
    50: '#E1F2F4',
    100: '#B4DEE3',
    300: '#54B3C0',
    500: '#087E8B',
    600: '#066872',
    700: '#04525A',
  },
  secondary: {
    100: '#D7DCE2',
    500: '#546E7A',
    700: '#3B505A',
  },
  tertiary: {
    100: '#C8E6C9',
    300: '#66BB6A',
    500: '#2E7D32',
    700: '#1B5E20',
  },
  neutral: {
    0:   '#FFFFFF',
    50:  '#F8F9FA',
    100: '#EEF1F4',
    200: '#DDE2E7',
    300: '#C4CAD1',
    500: '#8C949C',
    700: '#4A5159',
    900: '#1A1F24',
  },
  warning: '#F5A623',
  danger:  '#D32F2F',
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const spacing = {
  1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48,
} as const;
