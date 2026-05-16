import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

const STORAGE_KEY = 'diabetcare_target';

export type GlycemiaTarget = {
  /** mg/dL */
  min: number;
  /** mg/dL */
  max: number;
};

const DEFAULT_TARGET: GlycemiaTarget = { min: 70, max: 180 };

function loadTarget(): GlycemiaTarget {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_TARGET;
    const parsed = JSON.parse(raw) as Partial<GlycemiaTarget>;
    const min = Number(parsed.min);
    const max = Number(parsed.max);
    if (isFinite(min) && isFinite(max) && min > 0 && max > min) {
      return { min, max };
    }
  } catch { /* ignore */ }
  return DEFAULT_TARGET;
}

type TargetContextValue = {
  target: GlycemiaTarget;
  setTarget: (t: GlycemiaTarget) => void;
};

const GlycemiaTargetContext = createContext<TargetContextValue>({
  target: DEFAULT_TARGET,
  setTarget: () => {},
});

export function GlycemiaTargetProvider({ children }: { children: ReactNode }) {
  const [target, _setTarget] = useState<GlycemiaTarget>(loadTarget);

  const setTarget = useCallback((t: GlycemiaTarget) => {
    _setTarget(t);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(t)); } catch { /* ignore */ }
  }, []);

  return (
    <GlycemiaTargetContext.Provider value={{ target, setTarget }}>
      {children}
    </GlycemiaTargetContext.Provider>
  );
}

export function useGlycemiaTarget() {
  return useContext(GlycemiaTargetContext);
}
