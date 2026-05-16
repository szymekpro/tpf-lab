import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { GlycemiaUnit } from '../mocks';

const STORAGE_KEY = 'diabetcare_unit';
const DEFAULT_UNIT: GlycemiaUnit = 'mg/dL';

const MGDL_TO_MMOLL = 0.0555;

/** Przelicz mg/dL → wybraną jednostkę. */
export function convertGlycemia(mgdl: number, unit: GlycemiaUnit): number {
  if (unit === 'mmol/L') return parseFloat((mgdl * MGDL_TO_MMOLL).toFixed(1));
  return Math.round(mgdl);
}

/** Formatuje wartość z jednostką jako string, np. "6.9 mmol/L" lub "124 mg/dL". */
export function formatGlycemia(mgdl: number, unit: GlycemiaUnit): string {
  return `${convertGlycemia(mgdl, unit)} ${unit}`;
}

function loadUnit(): GlycemiaUnit {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'mg/dL' || stored === 'mmol/L') return stored;
  } catch { /* ignore */ }
  return DEFAULT_UNIT;
}

type UnitContextValue = {
  unit: GlycemiaUnit;
  setUnit: (u: GlycemiaUnit) => void;
};

const UnitContext = createContext<UnitContextValue>({
  unit: DEFAULT_UNIT,
  setUnit: () => {},
});

export function UnitProvider({ children }: { children: ReactNode }) {
  const [unit, _setUnit] = useState<GlycemiaUnit>(loadUnit);

  const setUnit = useCallback((u: GlycemiaUnit) => {
    _setUnit(u);
    try { localStorage.setItem(STORAGE_KEY, u); } catch { /* ignore */ }
  }, []);

  return (
    <UnitContext.Provider value={{ unit, setUnit }}>
      {children}
    </UnitContext.Provider>
  );
}

export function useUnit() {
  return useContext(UnitContext);
}
