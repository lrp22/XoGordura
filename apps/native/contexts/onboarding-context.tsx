import type { ActivityLevel, MacroPresetKey } from "@/lib/calories";
import { MACRO_PRESETS } from "@/lib/calories";
import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  type ReactNode,
} from "react";

export interface OnboardingData {
  birthYear: number;
  gender: "male" | "female";
  heightCm: number;
  currentWeightKg: number;
  goalWeightKg: number;
  activityLevel: ActivityLevel;
  deficitPercentage: number;
  macroPreset: MacroPresetKey;
}

interface OnboardingContextType {
  data: OnboardingData;
  update: (partial: Partial<OnboardingData>) => void;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

const DEFAULT_DATA: OnboardingData = {
  birthYear: 1990,
  gender: "female",
  heightCm: 165,
  currentWeightKg: 80,
  goalWeightKg: 70,
  activityLevel: "sedentary",
  deficitPercentage: 0.2,
  macroPreset: "moderate",
};

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<OnboardingData>(DEFAULT_DATA);

  const update = useCallback((partial: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  }, []);

  const value = useMemo(() => ({ data, update }), [data, update]);

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx)
    throw new Error("useOnboarding must be used within OnboardingProvider");
  return ctx;
}
