import { assignConfidence, computeWeightedAverage } from "./aggregator";
import { searchFatSecret } from "./fatsecret";
import { parseWithAI } from "./gemini";
import { resolvePortionGrams } from "./portions";
import { scaleTaco, searchTaco } from "./taco-database";
import type {
  MealAnalysisResult,
  NutritionSource,
  ParsedFoodItem,
} from "./types";

// ─── Config from environment ─────────────────────────────
interface PipelineConfig {
  geminiApiKey: string;
  groqApiKey?: string;
  fatSecretClientId?: string;
  fatSecretClientSecret?: string;
}

function getConfig(): PipelineConfig {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    throw new Error("GEMINI_API_KEY is required");
  }

  return {
    geminiApiKey,
    groqApiKey: process.env.GROQ_API_KEY,
    fatSecretClientId: process.env.FATSECRET_CLIENT_ID,
    fatSecretClientSecret: process.env.FATSECRET_CLIENT_SECRET,
  };
}

// ─── Look up a single food item across all sources ───────
async function lookupFoodItem(
  item: ParsedFoodItem,
  config: PipelineConfig,
): Promise<NutritionSource[]> {
  const sources: NutritionSource[] = [];

  // Resolve portion to grams
  const portionG = resolvePortionGrams(
    item.name,
    item.portion,
    item.estimatedGrams,
  );

  // ── Source 1: TACO (instant, local) ────────────────
  if (item.type === "basic") {
    const tacoResults = searchTaco(item.name);
    if (tacoResults.length > 0) {
      const best = tacoResults[0]!;
      const scaled = scaleTaco(best, portionG);
      sources.push(
        assignConfidence(
          {
            source: "taco",
            ...scaled,
            portionG,
            confidence: 0,
          },
          item.type,
        ),
      );
    }
  }

  // ── Source 2: FatSecret (API call) ─────────────────
  if (config.fatSecretClientId && config.fatSecretClientSecret) {
    const searchQuery = item.brand ? `${item.brand} ${item.name}` : item.name;
    const result = await searchFatSecret(
      searchQuery,
      portionG,
      config.fatSecretClientId,
      config.fatSecretClientSecret,
    );
    if (result) {
      sources.push(assignConfidence(result, item.type));
    }
  }

  // ── Source 3: AI Estimate (always available) ───────
  sources.push(
    assignConfidence(
      {
        source: "ai_estimate",
        calories: item.aiEstimate.calories,
        proteinG: item.aiEstimate.proteinG,
        carbsG: item.aiEstimate.carbsG,
        fatG: item.aiEstimate.fatG,
        portionG,
        confidence: 0,
      },
      item.type,
    ),
  );

  return sources;
}

// ─── Main pipeline entry point ───────────────────────────
export async function analyzeMeal(
  voiceTranscript: string,
): Promise<MealAnalysisResult> {
  const config = getConfig();

  // ═══ STEP 1: Parse with AI (Gemini → Groq fallback) ═══
  const parsed = await parseWithAI(
    voiceTranscript,
    config.geminiApiKey,
    config.groqApiKey,
  );

  // ═══ STEP 2: Look up each item across all sources ═══
  const itemResults = await Promise.all(
    parsed.items.map(async (item) => {
      const sources = await lookupFoodItem(item, config);
      return computeWeightedAverage(sources, item.name, item.portion);
    }),
  );

  // ═══ STEP 3: Aggregate totals ═══
  const totals = itemResults.reduce(
    (acc, item) => ({
      totalCalories: acc.totalCalories + item.calories,
      totalProteinG: acc.totalProteinG + item.proteinG,
      totalCarbsG: acc.totalCarbsG + item.carbsG,
      totalFatG: acc.totalFatG + item.fatG,
    }),
    { totalCalories: 0, totalProteinG: 0, totalCarbsG: 0, totalFatG: 0 },
  );

  // ═══ STEP 4: Overall confidence ═══
  const confidenceCounts = { high: 0, medium: 0, low: 0 };
  for (const item of itemResults) {
    confidenceCounts[item.confidence]++;
  }
  let overallConfidence: "high" | "medium" | "low";
  if (confidenceCounts.low > 0) {
    overallConfidence = "low";
  } else if (confidenceCounts.medium > confidenceCounts.high) {
    overallConfidence = "medium";
  } else {
    overallConfidence = "high";
  }

  return {
    items: itemResults,
    totalCalories: Math.round(totals.totalCalories),
    totalProteinG: +totals.totalProteinG.toFixed(1),
    totalCarbsG: +totals.totalCarbsG.toFixed(1),
    totalFatG: +totals.totalFatG.toFixed(1),
    overallConfidence,
    tip: parsed.tip,
  };
}
