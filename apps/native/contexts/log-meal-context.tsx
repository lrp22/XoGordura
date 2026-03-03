import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

// ─── Types (mirrors API MealAnalysisResult) ──────────────
export interface AnalyzedItem {
  name: string;
  portion: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  confidence: "high" | "medium" | "low";
  sourcesUsed: string[];
  bestSource: string;
}

export interface AnalysisResult {
  items: AnalyzedItem[];
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
  overallConfidence: "high" | "medium" | "low";
  tip: string;
}

// ─── Context ─────────────────────────────────────────────
interface LogMealContextType {
  mealType: string;
  voiceTranscript: string;
  analysisResult: AnalysisResult | null;
  setMealType: (type: string) => void;
  setVoiceTranscript: (text: string) => void;
  setAnalysisResult: (result: AnalysisResult | null) => void;
  reset: () => void;
}

const LogMealContext = createContext<LogMealContextType | null>(null);

export function LogMealProvider({ children }: { children: ReactNode }) {
  const [mealType, setMealType] = useState("lunch");
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null,
  );

  const reset = useCallback(() => {
    setMealType("lunch");
    setVoiceTranscript("");
    setAnalysisResult(null);
  }, []);

  const value = useMemo(
    () => ({
      mealType,
      voiceTranscript,
      analysisResult,
      setMealType,
      setVoiceTranscript,
      setAnalysisResult,
      reset,
    }),
    [mealType, voiceTranscript, analysisResult, reset],
  );

  return (
    <LogMealContext.Provider value={value}>{children}</LogMealContext.Provider>
  );
}

export function useLogMeal() {
  const ctx = useContext(LogMealContext);
  if (!ctx) throw new Error("useLogMeal must be used within LogMealProvider");
  return ctx;
}
