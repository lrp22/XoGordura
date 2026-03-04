// ─── Parsed food item from AI ────────────────────────────
export interface ParsedFoodItem {
  name: string;
  nameEn: string;
  portion: string;
  estimatedGrams: number;
  type: "basic" | "branded";
  brand: string | null;
  aiEstimate: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    fiberG: number;
    sugarG: number;
    glycemicLoad: "low" | "medium" | "high";
  };
}

// ─── AI parsing response ─────────────────────────────────
export interface GeminiParseResponse {
  items: ParsedFoodItem[];
  tip: string;
}

// ─── Single source lookup result ─────────────────────────
export interface NutritionSource {
  source: "taco" | "fatsecret" | "web" | "ai_estimate";
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  sugarG: number;
  portionG: number;
  confidence: number;
}

// ─── Aggregated result for one food item ─────────────────
export interface FoodItemResult {
  name: string;
  portion: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  sugarG: number;
  netCarbsG: number;
  glycemicLoad: "low" | "medium" | "high";
  confidence: "high" | "medium" | "low";
  sourcesUsed: string[];
  bestSource: string;
}

// ─── Full meal analysis response ─────────────────────────
export interface MealAnalysisResult {
  items: FoodItemResult[];
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
  totalFiberG: number;
  totalSugarG: number;
  totalNetCarbsG: number;
  overallConfidence: "high" | "medium" | "low";
  tip: string;
}

// ─── TACO food entry (per 100g) ──────────────────────────
export interface TacoFood {
  name: string;
  normalized: string;
  category: string;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
}

// ─── Brazilian portion reference ─────────────────────────
export interface PortionInfo {
  defaultG: number;
  unit: string;
  smallG: number;
  mediumG: number;
  largeG: number;
}
