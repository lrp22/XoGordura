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

async function lookupFoodItem(
  item: ParsedFoodItem,
  config: PipelineConfig,
): Promise<{
  sources: NutritionSource[];
  glycemicLoad: "low" | "medium" | "high";
}> {
  const sources: NutritionSource[] = [];

  const portionG = resolvePortionGrams(
    item.name,
    item.portion,
    item.estimatedGrams,
  );

  // ── Source 1: TACO (instant, local) ────────────────
  if (item.type === "basic") {
    const tacoResults = searchTaco(item.name);
    console.log(
      `[Pipeline] TACO "${item.name}": ${tacoResults.length} results`,
    );
    if (tacoResults.length > 0) {
      const best = tacoResults[0]!;
      const scaled = scaleTaco(best, portionG);

      // TACO has fiberG on the raw entry (per 100g), scale it manually
      const fiberScaled = ((best.fiberG ?? 0) * portionG) / 100;

      sources.push(
        assignConfidence(
          {
            source: "taco",
            calories: scaled.calories,
            proteinG: scaled.proteinG,
            carbsG: scaled.carbsG,
            fatG: scaled.fatG,
            fiberG: +fiberScaled.toFixed(1),
            sugarG: 0, // TACO doesn't have sugar breakdown
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
    console.log(
      `[Pipeline] FatSecret calling for: "${searchQuery}" (type: ${item.type})`,
    );
    const result = await searchFatSecret(
      searchQuery,
      portionG,
      config.fatSecretClientId,
      config.fatSecretClientSecret,
    );
    console.log(`[Pipeline] FatSecret result: ${result ? "hit ✓" : "miss ✗"}`);
    if (result) {
      sources.push(
        assignConfidence(
          {
            ...result,
            fiberG: (result as any).fiberG ?? 0,
            sugarG: (result as any).sugarG ?? 0,
          },
          item.type,
        ),
      );
    } else {
      console.log("[Pipeline] FatSecret SKIPPED — missing env vars:", {
        hasId: !!config.fatSecretClientId,
        hasSecret: !!config.fatSecretClientSecret,
      });
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
        fiberG: item.aiEstimate.fiberG ?? 0,
        sugarG: item.aiEstimate.sugarG ?? 0,
        portionG,
        confidence: 0,
      },
      item.type,
    ),
  );

  return {
    sources,
    glycemicLoad: item.aiEstimate.glycemicLoad ?? "medium",
  };
}

export async function analyzeMeal(
  voiceTranscript: string,
): Promise<MealAnalysisResult> {
  const config = getConfig();

  // ═══ STEP 1: Parse with AI ═══
  const parsed = await parseWithAI(
    voiceTranscript,
    config.geminiApiKey,
    config.groqApiKey,
  );

  // ═══ STEP 2: Look up each item ═══
  const itemResults = await Promise.all(
    parsed.items.map(async (item) => {
      const { sources, glycemicLoad } = await lookupFoodItem(item, config);
      return computeWeightedAverage(
        sources,
        item.name,
        item.portion,
        glycemicLoad,
      );
    }),
  );

  // ═══ STEP 3: Aggregate totals ═══
  const totals = itemResults.reduce(
    (acc, item) => ({
      totalCalories: acc.totalCalories + item.calories,
      totalProteinG: acc.totalProteinG + item.proteinG,
      totalCarbsG: acc.totalCarbsG + item.carbsG,
      totalFatG: acc.totalFatG + item.fatG,
      totalFiberG: acc.totalFiberG + item.fiberG,
      totalSugarG: acc.totalSugarG + item.sugarG,
    }),
    {
      totalCalories: 0,
      totalProteinG: 0,
      totalCarbsG: 0,
      totalFatG: 0,
      totalFiberG: 0,
      totalSugarG: 0,
    },
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

  const totalNetCarbsG = Math.max(0, totals.totalCarbsG - totals.totalFiberG);

  return {
    items: itemResults,
    totalCalories: Math.round(totals.totalCalories),
    totalProteinG: +totals.totalProteinG.toFixed(1),
    totalCarbsG: +totals.totalCarbsG.toFixed(1),
    totalFatG: +totals.totalFatG.toFixed(1),
    totalFiberG: +totals.totalFiberG.toFixed(1),
    totalSugarG: +totals.totalSugarG.toFixed(1),
    totalNetCarbsG: +totalNetCarbsG.toFixed(1),
    overallConfidence,
    tip: parsed.tip,
  };
}
