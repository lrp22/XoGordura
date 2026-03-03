// ─── Parsed food item from Gemini ────────────────────────
export interface ParsedFoodItem {
  name: string; // "Arroz branco"
  nameEn: string; // "cooked white rice" (for Nutritionix)
  portion: string; // "1 escumadeira média"
  estimatedGrams: number; // 125
  type: "basic" | "branded"; // basic = homemade, branded = packaged
  brand: string | null;
  aiEstimate: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
}

// ─── Gemini parsing response ─────────────────────────────
export interface GeminiParseResponse {
  items: ParsedFoodItem[];
  tip: string;
}

// ─── Single source lookup result ─────────────────────────
export interface NutritionSource {
  source: "taco" | "fatsecret" | "nutritionix" | "web" | "ai_estimate";
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  portionG: number;
  confidence: number; // 0.0 – 1.0
}

// ─── Aggregated result for one food item ─────────────────
export interface FoodItemResult {
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

// ─── Full meal analysis response ─────────────────────────
export interface MealAnalysisResult {
  items: FoodItemResult[];
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
  overallConfidence: "high" | "medium" | "low";
  tip: string;
}

// ─── TACO food entry (per 100g) ──────────────────────────
export interface TacoFood {
  name: string; // "Arroz, tipo 1, cozido"
  normalized: string; // "arroz tipo 1 cozido"
  category: string; // "cereais"
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
